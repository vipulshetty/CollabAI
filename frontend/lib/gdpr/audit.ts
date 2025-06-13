import { createClient } from '@/lib/supabase/client';
import { GDPREncryption } from './encryption';

// GDPR Audit Logging System
export enum AuditAction {
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  DATA_DELETE = 'data_delete',
  DATA_MODIFY = 'data_modify',
  CONSENT_UPDATE = 'consent_update',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCOUNT_CREATE = 'account_create',
  ACCOUNT_DELETE = 'account_delete',
  MEETING_CREATE = 'meeting_create',
  MEETING_JOIN = 'meeting_join',
  TRANSCRIPT_ACCESS = 'transcript_access',
  AI_PROCESSING = 'ai_processing'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: AuditSeverity;
  gdpr_relevant: boolean;
  retention_until?: string;
  created_at?: string;
}

export class AuditLogger {
  private supabase = createClient();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.AUDIT_LOG_ENABLED === 'true';
  }

  /**
   * Log a GDPR-relevant audit event
   */
  async log(
    action: AuditAction,
    resourceType: string,
    details: Record<string, any>,
    userId?: string,
    resourceId?: string,
    severity: AuditSeverity = AuditSeverity.MEDIUM
  ): Promise<boolean> {
    if (!this.isEnabled) {
      return true; // Silently succeed if logging is disabled
    }

    try {
      const now = new Date();
      const retentionDays = this.getRetentionPeriod(action);
      const retentionDate = new Date(now);
      retentionDate.setDate(retentionDate.getDate() + retentionDays);

      // Sanitize sensitive data in details
      const sanitizedDetails = this.sanitizeDetails(details);

      const auditEntry: AuditLogEntry = {
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: sanitizedDetails,
        severity,
        gdpr_relevant: this.isGDPRRelevant(action),
        retention_until: retentionDate.toISOString(),
        created_at: now.toISOString()
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to log audit event:', error);
        return false;
      }

      // For critical events, also log to external system if configured
      if (severity === AuditSeverity.CRITICAL) {
        await this.logCriticalEvent(auditEntry);
      }

      return true;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return false;
    }
  }

  /**
   * Log data access for GDPR compliance
   */
  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessType: 'read' | 'write' | 'delete',
    dataCategories: string[]
  ): Promise<boolean> {
    return this.log(
      AuditAction.DATA_ACCESS,
      resourceType,
      {
        access_type: accessType,
        data_categories: dataCategories,
        gdpr_basis: 'legitimate_interest'
      },
      userId,
      resourceId,
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Log consent changes
   */
  async logConsentChange(
    userId: string,
    consentType: string,
    oldStatus: string,
    newStatus: string,
    legalBasis: string
  ): Promise<boolean> {
    return this.log(
      AuditAction.CONSENT_UPDATE,
      'user_consent',
      {
        consent_type: consentType,
        old_status: oldStatus,
        new_status: newStatus,
        legal_basis: legalBasis
      },
      userId,
      undefined,
      AuditSeverity.HIGH
    );
  }

  /**
   * Log data export request (GDPR Article 20)
   */
  async logDataExport(
    userId: string,
    exportType: 'full' | 'partial',
    dataCategories: string[]
  ): Promise<boolean> {
    return this.log(
      AuditAction.DATA_EXPORT,
      'user_data',
      {
        export_type: exportType,
        data_categories: dataCategories,
        gdpr_article: 'Article 20 - Right to data portability'
      },
      userId,
      undefined,
      AuditSeverity.HIGH
    );
  }

  /**
   * Log data deletion request (GDPR Article 17)
   */
  async logDataDeletion(
    userId: string,
    deletionType: 'account' | 'specific_data',
    dataCategories: string[],
    reason: string
  ): Promise<boolean> {
    return this.log(
      AuditAction.DATA_DELETE,
      'user_data',
      {
        deletion_type: deletionType,
        data_categories: dataCategories,
        reason,
        gdpr_article: 'Article 17 - Right to erasure'
      },
      userId,
      undefined,
      AuditSeverity.CRITICAL
    );
  }

  /**
   * Log AI processing activities
   */
  async logAIProcessing(
    userId: string,
    processingType: string,
    inputDataCategories: string[],
    outputDataCategories: string[],
    model: string
  ): Promise<boolean> {
    return this.log(
      AuditAction.AI_PROCESSING,
      'ai_processing',
      {
        processing_type: processingType,
        input_categories: inputDataCategories,
        output_categories: outputDataCategories,
        model_used: model,
        gdpr_basis: 'consent'
      },
      userId,
      undefined,
      AuditSeverity.MEDIUM
    );
  }

  /**
   * Get audit logs for a specific user (for transparency)
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('gdpr_relevant', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get user audit logs:', error);
        return [];
      }

      // Sanitize logs before returning to user
      return data.map(log => ({
        ...log,
        details: this.sanitizeDetailsForUser(log.details)
      }));
    } catch (error) {
      console.error('Error getting user audit logs:', error);
      return [];
    }
  }

  /**
   * Clean up expired audit logs
   */
  async cleanupExpiredLogs(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from('audit_logs')
        .delete()
        .lt('retention_until', now)
        .select('id');

      if (error) {
        console.error('Failed to cleanup expired logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up expired logs:', error);
      return 0;
    }
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'phone'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (field === 'email') {
          sanitized[field] = GDPREncryption.anonymizeEmail(sanitized[field]);
        } else {
          sanitized[field] = GDPREncryption.hash(sanitized[field]);
        }
      }
    }

    return sanitized;
  }

  private sanitizeDetailsForUser(details: Record<string, any>): Record<string, any> {
    const userSafe = { ...details };
    
    // Remove internal system details that users shouldn't see
    const internalFields = ['internal_id', 'system_token', 'debug_info'];
    
    for (const field of internalFields) {
      delete userSafe[field];
    }

    return userSafe;
  }

  private isGDPRRelevant(action: AuditAction): boolean {
    const gdprRelevantActions = [
      AuditAction.DATA_ACCESS,
      AuditAction.DATA_EXPORT,
      AuditAction.DATA_DELETE,
      AuditAction.DATA_MODIFY,
      AuditAction.CONSENT_UPDATE,
      AuditAction.ACCOUNT_CREATE,
      AuditAction.ACCOUNT_DELETE,
      AuditAction.AI_PROCESSING
    ];

    return gdprRelevantActions.includes(action);
  }

  private getRetentionPeriod(action: AuditAction): number {
    // Audit log retention periods in days
    const retentionPeriods = {
      [AuditAction.DATA_ACCESS]: 1095, // 3 years
      [AuditAction.DATA_EXPORT]: 2555, // 7 years
      [AuditAction.DATA_DELETE]: 2555, // 7 years
      [AuditAction.DATA_MODIFY]: 1095, // 3 years
      [AuditAction.CONSENT_UPDATE]: 2555, // 7 years
      [AuditAction.LOGIN]: 365, // 1 year
      [AuditAction.LOGOUT]: 365, // 1 year
      [AuditAction.ACCOUNT_CREATE]: 2555, // 7 years
      [AuditAction.ACCOUNT_DELETE]: 2555, // 7 years
      [AuditAction.MEETING_CREATE]: 1095, // 3 years
      [AuditAction.MEETING_JOIN]: 365, // 1 year
      [AuditAction.TRANSCRIPT_ACCESS]: 1095, // 3 years
      [AuditAction.AI_PROCESSING]: 1095 // 3 years
    };

    return retentionPeriods[action] || 1095; // Default 3 years
  }

  private async logCriticalEvent(auditEntry: AuditLogEntry): Promise<void> {
    // In a production environment, you might want to:
    // 1. Send to external SIEM system
    // 2. Send alerts to security team
    // 3. Log to separate high-security database
    
    console.warn('CRITICAL AUDIT EVENT:', {
      action: auditEntry.action,
      user_id: auditEntry.user_id,
      resource_type: auditEntry.resource_type,
      timestamp: auditEntry.created_at
    });
  }
}
