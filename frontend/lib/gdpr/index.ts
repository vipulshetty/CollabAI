// GDPR Compliance Suite for CollabAI
// Implements comprehensive GDPR compliance including encryption, consent management,
// audit logging, data retention, export, and deletion capabilities

export { GDPREncryption, DataClassification, GDPRDataCategory, createEncryptedField } from './encryption';
export { 
  ConsentManager, 
  ConsentType, 
  ConsentStatus, 
  type ConsentRecord, 
  type ConsentPreferences 
} from './consent';
export { 
  AuditLogger, 
  AuditAction, 
  AuditSeverity, 
  type AuditLogEntry 
} from './audit';
export { 
  DataRetentionManager, 
  RetentionPolicy, 
  type RetentionRule, 
  type DataCleanupResult 
} from './retention';
export { 
  DataExportManager, 
  type UserDataExport, 
  type ExportableData 
} from './export';
export { 
  DataDeletionManager, 
  DeletionReason, 
  DeletionStatus, 
  type DeletionRequest, 
  type DeletionResult 
} from './deletion';

import { ConsentManager } from './consent';
import { AuditLogger } from './audit';
import { DataRetentionManager } from './retention';
import { DataExportManager } from './export';
import { DataDeletionManager } from './deletion';

/**
 * Main GDPR Compliance Manager
 * Provides a unified interface for all GDPR compliance operations
 */
export class GDPRComplianceManager {
  public readonly consent: ConsentManager;
  public readonly audit: AuditLogger;
  public readonly retention: DataRetentionManager;
  public readonly export: DataExportManager;
  public readonly deletion: DataDeletionManager;

  constructor() {
    this.consent = new ConsentManager();
    this.audit = new AuditLogger();
    this.retention = new DataRetentionManager();
    this.export = new DataExportManager();
    this.deletion = new DataDeletionManager();
  }

  /**
   * Initialize GDPR compliance for a new user
   */
  async initializeUserCompliance(userId: string, email: string): Promise<boolean> {
    try {
      // Record initial essential consent
      await this.consent.recordConsent(
        userId,
        'essential' as any,
        'granted' as any,
        'legitimate_interest',
        'Essential functionality and security',
        ['technical', 'identity']
      );

      // Log account creation
      await this.audit.log(
        'account_create' as any,
        'user_account',
        {
          user_email: email,
          gdpr_initialized: true,
          compliance_version: '1.0'
        },
        userId,
        userId,
        'medium' as any
      );

      return true;
    } catch (error) {
      console.error('Failed to initialize GDPR compliance:', error);
      return false;
    }
  }

  /**
   * Process a user's GDPR request (export, deletion, etc.)
   */
  async processGDPRRequest(
    userId: string,
    requestType: 'export' | 'deletion' | 'consent_update',
    requestData: any
  ): Promise<{ success: boolean; requestId?: string; message: string }> {
    try {
      switch (requestType) {
        case 'export':
          const exportRequest = await this.export.requestDataExport(
            userId,
            requestData.exportType || 'full',
            requestData.dataCategories || [],
            requestData.fileFormat || 'json'
          );
          
          return {
            success: !!exportRequest,
            requestId: exportRequest?.export_id,
            message: exportRequest 
              ? 'Data export request submitted successfully. You will be notified when ready.'
              : 'Failed to submit data export request.'
          };

        case 'deletion':
          const deletionRequest = requestData.fullAccount
            ? await this.deletion.requestAccountDeletion(userId, requestData.reason)
            : await this.deletion.requestSpecificDataDeletion(
                userId,
                requestData.dataCategories || [],
                requestData.specificRecords,
                requestData.reason
              );

          return {
            success: !!deletionRequest,
            requestId: deletionRequest?.id,
            message: deletionRequest
              ? 'Data deletion request submitted. Please check your email for verification.'
              : 'Failed to submit data deletion request.'
          };

        case 'consent_update':
          const consentUpdated = await this.consent.updateConsents(
            userId,
            requestData.preferences
          );

          return {
            success: consentUpdated,
            message: consentUpdated
              ? 'Consent preferences updated successfully.'
              : 'Failed to update consent preferences.'
          };

        default:
          return {
            success: false,
            message: 'Invalid request type.'
          };
      }
    } catch (error) {
      console.error('Error processing GDPR request:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request.'
      };
    }
  }

  /**
   * Get comprehensive GDPR status for a user
   */
  async getUserGDPRStatus(userId: string): Promise<{
    consents: any;
    dataRetention: any[];
    activeExports: any[];
    deletionRequests: any[];
    auditLogCount: number;
    complianceScore: number;
  }> {
    try {
      const [
        consents,
        dataRetention,
        activeExports,
        deletionRequests,
        auditLogs
      ] = await Promise.all([
        this.consent.getUserConsents(userId),
        this.retention.getUserDataRetentionStatus(userId),
        this.export.getUserExports(userId),
        this.deletion.getUserDeletionRequests(userId),
        this.audit.getUserAuditLogs(userId, 10)
      ]);

      // Calculate compliance score (0-100)
      const complianceScore = this.calculateComplianceScore({
        hasValidConsents: Object.values(consents).some(Boolean),
        hasRecentAuditActivity: auditLogs.length > 0,
        hasDataRetentionPolicies: dataRetention.length > 0,
        noPendingDeletions: !deletionRequests.some(r => r.status === 'pending')
      });

      return {
        consents,
        dataRetention,
        activeExports: activeExports.filter(e => e.status !== 'expired'),
        deletionRequests,
        auditLogCount: auditLogs.length,
        complianceScore
      };
    } catch (error) {
      console.error('Error getting GDPR status:', error);
      return {
        consents: {},
        dataRetention: [],
        activeExports: [],
        deletionRequests: [],
        auditLogCount: 0,
        complianceScore: 0
      };
    }
  }

  /**
   * Run automated compliance checks
   */
  async runComplianceCheck(): Promise<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if encryption is properly configured
      if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 32) {
        issues.push('Encryption key is not properly configured');
        recommendations.push('Set a 32-character ENCRYPTION_KEY environment variable');
      }

      // Check if audit logging is enabled
      if (process.env.AUDIT_LOG_ENABLED !== 'true') {
        issues.push('Audit logging is disabled');
        recommendations.push('Enable audit logging by setting AUDIT_LOG_ENABLED=true');
      }

      // Check data retention configuration
      if (!process.env.DATA_RETENTION_DAYS) {
        issues.push('Data retention period not configured');
        recommendations.push('Set DATA_RETENTION_DAYS environment variable');
      }

      // Run cleanup check
      const cleanupResults = await this.retention.executeRetentionCleanup();
      const hasCleanupErrors = cleanupResults.some(r => r.errors.length > 0);
      
      if (hasCleanupErrors) {
        issues.push('Data retention cleanup has errors');
        recommendations.push('Review and fix data retention cleanup errors');
      }

      return {
        passed: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error running compliance check:', error);
      return {
        passed: false,
        issues: ['Failed to run compliance check'],
        recommendations: ['Check system logs and configuration']
      };
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(): Promise<{
    reportId: string;
    generatedAt: string;
    summary: {
      totalUsers: number;
      activeConsents: number;
      dataExportsThisMonth: number;
      deletionRequestsThisMonth: number;
      auditEventsThisMonth: number;
    };
    complianceStatus: 'compliant' | 'issues' | 'non_compliant';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const reportId = `gdpr-report-${Date.now()}`;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // This would typically query aggregated data from your database
      // For this example, we'll return a sample report structure
      
      const complianceCheck = await this.runComplianceCheck();
      
      return {
        reportId,
        generatedAt: now.toISOString(),
        summary: {
          totalUsers: 0, // Would be queried from database
          activeConsents: 0, // Would be queried from database
          dataExportsThisMonth: 0, // Would be queried from database
          deletionRequestsThisMonth: 0, // Would be queried from database
          auditEventsThisMonth: 0 // Would be queried from database
        },
        complianceStatus: complianceCheck.passed ? 'compliant' : 'issues',
        issues: complianceCheck.issues,
        recommendations: complianceCheck.recommendations
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  private calculateComplianceScore(factors: {
    hasValidConsents: boolean;
    hasRecentAuditActivity: boolean;
    hasDataRetentionPolicies: boolean;
    noPendingDeletions: boolean;
  }): number {
    let score = 0;
    
    if (factors.hasValidConsents) score += 25;
    if (factors.hasRecentAuditActivity) score += 25;
    if (factors.hasDataRetentionPolicies) score += 25;
    if (factors.noPendingDeletions) score += 25;
    
    return score;
  }
}

// Export singleton instance
export const gdprCompliance = new GDPRComplianceManager();
