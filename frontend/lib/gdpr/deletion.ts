import { createClient } from '@/lib/supabase/client';
import { AuditLogger, AuditAction, AuditSeverity } from './audit';
import { ConsentManager } from './consent';
import { GDPREncryption } from './encryption';

// GDPR Data Deletion System (Article 17 - Right to be Forgotten)
export enum DeletionReason {
  USER_REQUEST = 'user_request',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  DATA_NO_LONGER_NECESSARY = 'data_no_longer_necessary',
  UNLAWFUL_PROCESSING = 'unlawful_processing',
  LEGAL_OBLIGATION = 'legal_obligation',
  CHILD_CONSENT_WITHDRAWN = 'child_consent_withdrawn'
}

export enum DeletionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIALLY_COMPLETED = 'partially_completed'
}

export interface DeletionRequest {
  id?: string;
  user_id: string;
  request_type: 'full_account' | 'specific_data';
  reason: DeletionReason;
  data_categories?: string[];
  specific_records?: { table: string; record_id: string }[];
  status: DeletionStatus;
  requested_at: string;
  completed_at?: string;
  verification_token: string;
  verified_at?: string;
  notes?: string;
  retention_exceptions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface DeletionResult {
  table_name: string;
  records_deleted: number;
  records_anonymized: number;
  records_retained: number;
  retention_reason?: string;
  errors: string[];
}

export class DataDeletionManager {
  private supabase = createClient();
  private auditLogger = new AuditLogger();
  private consentManager = new ConsentManager();

  /**
   * Request account deletion (full GDPR erasure)
   */
  async requestAccountDeletion(
    userId: string,
    reason: DeletionReason = DeletionReason.USER_REQUEST
  ): Promise<DeletionRequest | null> {
    try {
      const verificationToken = GDPREncryption.generateConsentToken();
      
      const deletionRequest: DeletionRequest = {
        user_id: userId,
        request_type: 'full_account',
        reason,
        status: DeletionStatus.PENDING,
        requested_at: new Date().toISOString(),
        verification_token: verificationToken,
        data_categories: ['identity', 'contact', 'behavioral', 'biometric', 'technical'],
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('deletion_requests')
        .insert(deletionRequest)
        .select()
        .single();

      if (error) {
        console.error('Failed to create deletion request:', error);
        return null;
      }

      // Log deletion request
      await this.auditLogger.logDataDeletion(
        userId,
        'account',
        deletionRequest.data_categories || [],
        reason
      );

      // Send verification email (in production)
      await this.sendDeletionVerificationEmail(userId, verificationToken);

      return data;
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      return null;
    }
  }

  /**
   * Request deletion of specific data
   */
  async requestSpecificDataDeletion(
    userId: string,
    dataCategories: string[],
    specificRecords?: { table: string; record_id: string }[],
    reason: DeletionReason = DeletionReason.USER_REQUEST
  ): Promise<DeletionRequest | null> {
    try {
      const verificationToken = GDPREncryption.generateConsentToken();
      
      const deletionRequest: DeletionRequest = {
        user_id: userId,
        request_type: 'specific_data',
        reason,
        data_categories: dataCategories,
        specific_records: specificRecords,
        status: DeletionStatus.PENDING,
        requested_at: new Date().toISOString(),
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('deletion_requests')
        .insert(deletionRequest)
        .select()
        .single();

      if (error) {
        console.error('Failed to create specific deletion request:', error);
        return null;
      }

      // Log deletion request
      await this.auditLogger.logDataDeletion(
        userId,
        'specific_data',
        dataCategories,
        reason
      );

      return data;
    } catch (error) {
      console.error('Error requesting specific data deletion:', error);
      return null;
    }
  }

  /**
   * Verify and process deletion request
   */
  async verifyAndProcessDeletion(
    requestId: string,
    verificationToken: string
  ): Promise<boolean> {
    try {
      // Get deletion request
      const { data: request, error } = await this.supabase
        .from('deletion_requests')
        .select('*')
        .eq('id', requestId)
        .eq('verification_token', verificationToken)
        .single();

      if (error || !request) {
        console.error('Invalid deletion request or token');
        return false;
      }

      if (request.status !== DeletionStatus.PENDING) {
        console.error('Deletion request already processed');
        return false;
      }

      // Mark as verified and start processing
      await this.supabase
        .from('deletion_requests')
        .update({
          verified_at: new Date().toISOString(),
          status: DeletionStatus.IN_PROGRESS,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Process deletion asynchronously
      this.processDeletion(request).catch(error => {
        console.error('Failed to process deletion:', error);
      });

      return true;
    } catch (error) {
      console.error('Error verifying deletion request:', error);
      return false;
    }
  }

  /**
   * Process the actual data deletion
   */
  private async processDeletion(request: DeletionRequest): Promise<void> {
    const results: DeletionResult[] = [];

    try {
      if (request.request_type === 'full_account') {
        // Full account deletion
        results.push(...await this.deleteAllUserData(request.user_id));
        
        // Withdraw all consents
        await this.consentManager.withdrawAllConsents(request.user_id);
        
        // Delete auth account (last step)
        await this.deleteAuthAccount(request.user_id);
      } else {
        // Specific data deletion
        results.push(...await this.deleteSpecificData(request));
      }

      // Update deletion request status
      const hasErrors = results.some(r => r.errors.length > 0);
      const status = hasErrors ? DeletionStatus.PARTIALLY_COMPLETED : DeletionStatus.COMPLETED;

      await this.supabase
        .from('deletion_requests')
        .update({
          status,
          completed_at: new Date().toISOString(),
          notes: JSON.stringify(results),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      // Log completion
      await this.auditLogger.log(
        AuditAction.DATA_DELETE,
        'deletion_request',
        {
          request_id: request.id,
          request_type: request.request_type,
          status,
          results_summary: results.map(r => ({
            table: r.table_name,
            deleted: r.records_deleted,
            errors: r.errors.length
          }))
        },
        request.user_id,
        request.id,
        AuditSeverity.CRITICAL
      );

    } catch (error) {
      console.error('Error processing deletion:', error);
      
      await this.supabase
        .from('deletion_requests')
        .update({
          status: DeletionStatus.FAILED,
          notes: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);
    }
  }

  /**
   * Delete all user data across all tables
   */
  private async deleteAllUserData(userId: string): Promise<DeletionResult[]> {
    const results: DeletionResult[] = [];
    
    // Define tables and their deletion strategies
    const deletionPlan = [
      { table: 'meeting_transcripts', userField: 'created_by', strategy: 'delete' },
      { table: 'meetings', userField: 'created_by', strategy: 'anonymize' }, // Keep for other participants
      { table: 'user_consents', userField: 'user_id', strategy: 'delete' },
      { table: 'data_exports', userField: 'user_id', strategy: 'delete' },
      { table: 'deletion_requests', userField: 'user_id', strategy: 'retain' }, // Legal requirement
      { table: 'audit_logs', userField: 'user_id', strategy: 'anonymize' } // Legal requirement
    ];

    for (const plan of deletionPlan) {
      try {
        const result = await this.executeTableDeletion(userId, plan);
        results.push(result);
      } catch (error) {
        results.push({
          table_name: plan.table,
          records_deleted: 0,
          records_anonymized: 0,
          records_retained: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  /**
   * Delete specific data based on request
   */
  private async deleteSpecificData(request: DeletionRequest): Promise<DeletionResult[]> {
    const results: DeletionResult[] = [];

    if (request.specific_records) {
      // Delete specific records
      for (const record of request.specific_records) {
        try {
          const result = await this.deleteSpecificRecord(
            record.table,
            record.record_id,
            request.user_id
          );
          results.push(result);
        } catch (error) {
          results.push({
            table_name: record.table,
            records_deleted: 0,
            records_anonymized: 0,
            records_retained: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }
    }

    return results;
  }

  /**
   * Execute deletion plan for a specific table
   */
  private async executeTableDeletion(
    userId: string,
    plan: { table: string; userField: string; strategy: string }
  ): Promise<DeletionResult> {
    const result: DeletionResult = {
      table_name: plan.table,
      records_deleted: 0,
      records_anonymized: 0,
      records_retained: 0,
      errors: []
    };

    try {
      // Get records to process
      const { data: records, error: selectError } = await this.supabase
        .from(plan.table)
        .select('*')
        .eq(plan.userField, userId);

      if (selectError) {
        result.errors.push(`Failed to select records: ${selectError.message}`);
        return result;
      }

      if (!records || records.length === 0) {
        return result; // No records to process
      }

      switch (plan.strategy) {
        case 'delete':
          const { data: deleted, error: deleteError } = await this.supabase
            .from(plan.table)
            .delete()
            .eq(plan.userField, userId)
            .select('id');

          if (deleteError) {
            result.errors.push(`Failed to delete: ${deleteError.message}`);
          } else {
            result.records_deleted = deleted?.length || 0;
          }
          break;

        case 'anonymize':
          for (const record of records) {
            const anonymized = this.anonymizeRecord(record, plan.table);
            const { error: updateError } = await this.supabase
              .from(plan.table)
              .update(anonymized)
              .eq('id', record.id);

            if (updateError) {
              result.errors.push(`Failed to anonymize record ${record.id}: ${updateError.message}`);
            } else {
              result.records_anonymized++;
            }
          }
          break;

        case 'retain':
          result.records_retained = records.length;
          result.retention_reason = 'Legal obligation to retain audit records';
          break;
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Delete a specific record
   */
  private async deleteSpecificRecord(
    table: string,
    recordId: string,
    userId: string
  ): Promise<DeletionResult> {
    const result: DeletionResult = {
      table_name: table,
      records_deleted: 0,
      records_anonymized: 0,
      records_retained: 0,
      errors: []
    };

    try {
      // Verify user owns the record
      const { data: record, error: selectError } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', recordId)
        .single();

      if (selectError || !record) {
        result.errors.push('Record not found or access denied');
        return result;
      }

      // Check if user has permission to delete this record
      if (!this.canUserDeleteRecord(record, userId)) {
        result.errors.push('User does not have permission to delete this record');
        return result;
      }

      // Delete the record
      const { error: deleteError } = await this.supabase
        .from(table)
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        result.errors.push(`Failed to delete record: ${deleteError.message}`);
      } else {
        result.records_deleted = 1;
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Anonymize a record for retention purposes
   */
  private anonymizeRecord(record: any, tableName: string): any {
    const anonymized = { ...record };

    // Common anonymization patterns
    if (anonymized.user_id) {
      anonymized.user_id = GDPREncryption.hash(anonymized.user_id);
    }
    if (anonymized.created_by) {
      anonymized.created_by = GDPREncryption.hash(anonymized.created_by);
    }
    if (anonymized.email) {
      anonymized.email = GDPREncryption.anonymizeEmail(anonymized.email);
    }

    // Table-specific anonymization
    switch (tableName) {
      case 'meetings':
        if (anonymized.title) anonymized.title = 'Anonymized Meeting';
        if (anonymized.description) anonymized.description = 'Content anonymized';
        if (anonymized.participants) {
          anonymized.participants = anonymized.participants.map((p: string) => 
            GDPREncryption.hash(p)
          );
        }
        break;

      case 'audit_logs':
        if (anonymized.ip_address) {
          anonymized.ip_address = this.anonymizeIPAddress(anonymized.ip_address);
        }
        if (anonymized.details) {
          anonymized.details = this.sanitizeAuditDetails(anonymized.details);
        }
        break;
    }

    anonymized.anonymized_at = new Date().toISOString();
    anonymized.updated_at = new Date().toISOString();

    return anonymized;
  }

  /**
   * Delete user's authentication account
   */
  private async deleteAuthAccount(userId: string): Promise<void> {
    try {
      // In production, you would call Supabase Admin API to delete the user
      // For now, we'll log that this should be done
      console.log(`Auth account deletion required for user: ${userId}`);
      
      // Example of how this would be done with Supabase Admin API:
      // const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (error) {
      console.error('Failed to delete auth account:', error);
      throw error;
    }
  }

  /**
   * Check if user can delete a specific record
   */
  private canUserDeleteRecord(record: any, userId: string): boolean {
    // Check various ownership patterns
    return (
      record.user_id === userId ||
      record.created_by === userId ||
      (record.participants && record.participants.includes(userId))
    );
  }

  /**
   * Send deletion verification email
   */
  private async sendDeletionVerificationEmail(
    userId: string,
    verificationToken: string
  ): Promise<void> {
    // In production, send email with verification link
    console.log(`Deletion verification email should be sent to user ${userId} with token ${verificationToken}`);
  }

  /**
   * Get user's deletion requests
   */
  async getUserDeletionRequests(userId: string): Promise<DeletionRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Failed to get deletion requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting deletion requests:', error);
      return [];
    }
  }

  private anonymizeIPAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return '[IP_ANONYMIZED]';
  }

  private sanitizeAuditDetails(details: any): any {
    const sanitized = { ...details };
    const sensitiveFields = ['email', 'user_id', 'ip_address', 'session_id'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = GDPREncryption.hash(sanitized[field]);
      }
    }

    return sanitized;
  }
}
