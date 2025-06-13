import { createClient } from '@/lib/supabase/client';
import { AuditLogger, AuditAction, AuditSeverity } from './audit';
import { GDPREncryption } from './encryption';

// GDPR Data Retention and Cleanup System
export enum RetentionPolicy {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term', // 30 days
  MEDIUM_TERM = 'medium_term', // 1 year
  LONG_TERM = 'long_term', // 3 years
  BUSINESS_RECORDS = 'business_records', // 7 years
  LEGAL_HOLD = 'legal_hold' // Indefinite until hold is lifted
}

export interface RetentionRule {
  table_name: string;
  data_category: string;
  retention_policy: RetentionPolicy;
  retention_days: number;
  anonymize_after_days?: number;
  legal_basis: string;
  description: string;
}

export interface DataCleanupResult {
  table_name: string;
  records_deleted: number;
  records_anonymized: number;
  errors: string[];
}

export class DataRetentionManager {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  private readonly retentionRules: RetentionRule[] = [
    {
      table_name: 'audit_logs',
      data_category: 'technical',
      retention_policy: RetentionPolicy.LONG_TERM,
      retention_days: 1095, // 3 years
      legal_basis: 'legitimate_interest',
      description: 'Security and compliance audit logs'
    },
    {
      table_name: 'meeting_transcripts',
      data_category: 'biometric',
      retention_policy: RetentionPolicy.BUSINESS_RECORDS,
      retention_days: 2555, // 7 years
      anonymize_after_days: 1095, // Anonymize after 3 years
      legal_basis: 'contract',
      description: 'Meeting transcripts for business records'
    },
    {
      table_name: 'meetings',
      data_category: 'behavioral',
      retention_policy: RetentionPolicy.BUSINESS_RECORDS,
      retention_days: 2555, // 7 years
      legal_basis: 'contract',
      description: 'Meeting metadata and scheduling information'
    },
    {
      table_name: 'user_consents',
      data_category: 'identity',
      retention_policy: RetentionPolicy.BUSINESS_RECORDS,
      retention_days: 2555, // 7 years
      legal_basis: 'legal_obligation',
      description: 'GDPR consent records for compliance'
    },
    {
      table_name: 'user_sessions',
      data_category: 'technical',
      retention_policy: RetentionPolicy.SHORT_TERM,
      retention_days: 30,
      legal_basis: 'legitimate_interest',
      description: 'User session data for security'
    }
  ];

  /**
   * Execute data retention cleanup across all tables
   */
  async executeRetentionCleanup(): Promise<DataCleanupResult[]> {
    const results: DataCleanupResult[] = [];

    for (const rule of this.retentionRules) {
      try {
        const result = await this.cleanupTable(rule);
        results.push(result);

        // Log cleanup activity
        await this.auditLogger.log(
          AuditAction.DATA_DELETE,
          rule.table_name,
          {
            retention_policy: rule.retention_policy,
            records_deleted: result.records_deleted,
            records_anonymized: result.records_anonymized,
            legal_basis: rule.legal_basis
          },
          undefined,
          undefined,
          AuditSeverity.MEDIUM
        );
      } catch (error) {
        console.error(`Failed to cleanup table ${rule.table_name}:`, error);
        results.push({
          table_name: rule.table_name,
          records_deleted: 0,
          records_anonymized: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  /**
   * Clean up data for a specific table based on retention rules
   */
  private async cleanupTable(rule: RetentionRule): Promise<DataCleanupResult> {
    const result: DataCleanupResult = {
      table_name: rule.table_name,
      records_deleted: 0,
      records_anonymized: 0,
      errors: []
    };

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rule.retention_days);

      // First, anonymize records if specified
      if (rule.anonymize_after_days) {
        const anonymizeCutoff = new Date();
        anonymizeCutoff.setDate(anonymizeCutoff.getDate() - rule.anonymize_after_days);
        
        result.records_anonymized = await this.anonymizeRecords(
          rule.table_name,
          anonymizeCutoff,
          cutoffDate
        );
      }

      // Then delete expired records
      result.records_deleted = await this.deleteExpiredRecords(
        rule.table_name,
        cutoffDate
      );

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Delete expired records from a table
   */
  private async deleteExpiredRecords(tableName: string, cutoffDate: Date): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Anonymize records by replacing PII with hashed values
   */
  private async anonymizeRecords(
    tableName: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Get records to anonymize
      const { data: records, error: selectError } = await this.supabase
        .from(tableName)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (selectError) {
        throw new Error(`Failed to select records from ${tableName}: ${selectError.message}`);
      }

      if (!records || records.length === 0) {
        return 0;
      }

      // Anonymize each record
      const anonymizedRecords = records.map(record => 
        this.anonymizeRecord(record, tableName)
      );

      // Update records with anonymized data
      for (const record of anonymizedRecords) {
        const { error: updateError } = await this.supabase
          .from(tableName)
          .update(record)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Failed to anonymize record ${record.id}:`, updateError);
        }
      }

      return records.length;
    } catch (error) {
      console.error(`Error anonymizing records in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Anonymize a single record based on table-specific rules
   */
  private anonymizeRecord(record: any, tableName: string): any {
    const anonymized = { ...record };

    switch (tableName) {
      case 'meeting_transcripts':
        if (anonymized.content) {
          anonymized.content = this.anonymizeTranscriptContent(anonymized.content);
        }
        if (anonymized.speaker) {
          anonymized.speaker = GDPREncryption.hash(anonymized.speaker);
        }
        break;

      case 'meetings':
        if (anonymized.created_by) {
          anonymized.created_by = GDPREncryption.hash(anonymized.created_by);
        }
        if (anonymized.participants) {
          anonymized.participants = anonymized.participants.map((p: string) => 
            GDPREncryption.hash(p)
          );
        }
        if (anonymized.title) {
          anonymized.title = 'Anonymized Meeting';
        }
        if (anonymized.description) {
          anonymized.description = 'Content anonymized for privacy';
        }
        break;

      case 'audit_logs':
        if (anonymized.user_id) {
          anonymized.user_id = GDPREncryption.hash(anonymized.user_id);
        }
        if (anonymized.ip_address) {
          anonymized.ip_address = this.anonymizeIPAddress(anonymized.ip_address);
        }
        if (anonymized.details) {
          anonymized.details = this.anonymizeAuditDetails(anonymized.details);
        }
        break;
    }

    // Mark as anonymized
    anonymized.anonymized_at = new Date().toISOString();
    anonymized.updated_at = new Date().toISOString();

    return anonymized;
  }

  /**
   * Anonymize transcript content while preserving structure
   */
  private anonymizeTranscriptContent(content: string): string {
    // Replace names, emails, phone numbers, etc. with placeholders
    return content
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');
  }

  /**
   * Anonymize IP address by zeroing last octet
   */
  private anonymizeIPAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return '[IP_ANONYMIZED]';
  }

  /**
   * Anonymize audit log details
   */
  private anonymizeAuditDetails(details: any): any {
    const anonymized = { ...details };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'user_id', 'ip_address', 'session_id'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = GDPREncryption.hash(anonymized[field]);
      }
    }

    return anonymized;
  }

  /**
   * Get retention status for a user's data
   */
  async getUserDataRetentionStatus(userId: string): Promise<{
    table: string;
    record_count: number;
    oldest_record: string;
    retention_until: string;
    can_be_deleted: boolean;
  }[]> {
    const status = [];

    for (const rule of this.retentionRules) {
      try {
        const { data, error } = await this.supabase
          .from(rule.table_name)
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error || !data || data.length === 0) {
          continue;
        }

        const oldestRecord = new Date(data[0].created_at);
        const retentionUntil = new Date(oldestRecord);
        retentionUntil.setDate(retentionUntil.getDate() + rule.retention_days);

        status.push({
          table: rule.table_name,
          record_count: data.length,
          oldest_record: oldestRecord.toISOString(),
          retention_until: retentionUntil.toISOString(),
          can_be_deleted: new Date() > retentionUntil
        });
      } catch (error) {
        console.error(`Error getting retention status for ${rule.table_name}:`, error);
      }
    }

    return status;
  }

  /**
   * Schedule automatic cleanup job
   */
  async scheduleCleanup(): Promise<void> {
    // In a production environment, this would integrate with a job scheduler
    // For now, we'll just log that cleanup should be scheduled
    console.log('Data retention cleanup should be scheduled to run daily');
    
    // You could integrate with services like:
    // - Vercel Cron Jobs
    // - AWS Lambda with EventBridge
    // - Google Cloud Scheduler
    // - Node-cron for self-hosted solutions
  }
}
