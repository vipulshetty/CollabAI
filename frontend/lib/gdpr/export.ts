import { createClient } from '@/lib/supabase/client';
import { AuditLogger, AuditAction, AuditSeverity } from './audit';
import { GDPREncryption } from './encryption';

// GDPR Data Export System (Article 20 - Right to Data Portability)
export interface UserDataExport {
  export_id: string;
  user_id: string;
  export_type: 'full' | 'partial';
  requested_at: string;
  completed_at?: string;
  download_url?: string;
  expires_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  data_categories: string[];
  file_format: 'json' | 'csv' | 'xml';
  file_size?: number;
  error_message?: string;
}

export interface ExportableData {
  profile: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata: any;
  };
  meetings: {
    id: string;
    title: string;
    description?: string;
    status: string;
    scheduled_date: string;
    created_at: string;
    meeting_url?: string;
    participants: string[];
  }[];
  transcripts: {
    id: string;
    meeting_id: string;
    content: string;
    speaker?: string;
    timestamp: string;
    created_at: string;
  }[];
  consents: {
    id: string;
    consent_type: string;
    status: string;
    granted_at?: string;
    withdrawn_at?: string;
    legal_basis: string;
    purpose: string;
    created_at: string;
  }[];
  audit_logs: {
    id: string;
    action: string;
    resource_type: string;
    details: any;
    created_at: string;
  }[];
}

export class DataExportManager {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Request a full data export for a user
   */
  async requestDataExport(
    userId: string,
    exportType: 'full' | 'partial' = 'full',
    dataCategories: string[] = [],
    fileFormat: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<UserDataExport | null> {
    try {
      const exportId = GDPREncryption.generateConsentToken();
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30); // Export links expire in 30 days

      const exportRequest: UserDataExport = {
        export_id: exportId,
        user_id: userId,
        export_type: exportType,
        requested_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        data_categories: dataCategories.length > 0 ? dataCategories : this.getAllDataCategories(),
        file_format: fileFormat
      };

      // Save export request
      const { data, error } = await this.supabase
        .from('data_exports')
        .insert(exportRequest)
        .select()
        .single();

      if (error) {
        console.error('Failed to create export request:', error);
        return null;
      }

      // Log the export request
      await this.auditLogger.logDataExport(
        userId,
        exportType,
        exportRequest.data_categories
      );

      // Start processing the export asynchronously
      this.processDataExport(exportId).catch(error => {
        console.error('Failed to process data export:', error);
      });

      return data;
    } catch (error) {
      console.error('Error requesting data export:', error);
      return null;
    }
  }

  /**
   * Process a data export request
   */
  private async processDataExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportStatus(exportId, 'processing');

      // Get export request details
      const { data: exportRequest, error } = await this.supabase
        .from('data_exports')
        .select('*')
        .eq('export_id', exportId)
        .single();

      if (error || !exportRequest) {
        throw new Error('Export request not found');
      }

      // Collect user data
      const userData = await this.collectUserData(
        exportRequest.user_id,
        exportRequest.data_categories
      );

      // Generate export file
      const exportFile = await this.generateExportFile(
        userData,
        exportRequest.file_format
      );

      // In a production environment, you would:
      // 1. Upload the file to secure cloud storage (S3, Google Cloud Storage, etc.)
      // 2. Generate a signed URL for download
      // 3. Set up automatic cleanup of export files
      
      // For this example, we'll simulate the process
      const downloadUrl = await this.uploadExportFile(exportFile, exportId);

      // Update export request with completion details
      await this.supabase
        .from('data_exports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          download_url: downloadUrl,
          file_size: Buffer.byteLength(exportFile, 'utf8')
        })
        .eq('export_id', exportId);

      // Send notification to user (email, in-app notification, etc.)
      await this.notifyUserExportReady(exportRequest.user_id, exportId);

    } catch (error) {
      console.error('Error processing data export:', error);
      
      await this.supabase
        .from('data_exports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('export_id', exportId);
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(
    userId: string,
    dataCategories: string[]
  ): Promise<ExportableData> {
    const userData: ExportableData = {
      profile: {} as any,
      meetings: [],
      transcripts: [],
      consents: [],
      audit_logs: []
    };

    try {
      // Get user profile
      if (dataCategories.includes('identity') || dataCategories.includes('contact')) {
        const { data: user } = await this.supabase.auth.getUser();
        if (user.user) {
          userData.profile = {
            id: user.user.id,
            email: user.user.email || '',
            created_at: user.user.created_at,
            last_sign_in_at: user.user.last_sign_in_at,
            user_metadata: user.user.user_metadata
          };
        }
      }

      // Get meetings
      if (dataCategories.includes('behavioral')) {
        const { data: meetings } = await this.supabase
          .from('meetings')
          .select('*')
          .eq('created_by', userId);

        userData.meetings = meetings || [];
      }

      // Get transcripts
      if (dataCategories.includes('biometric')) {
        const { data: transcripts } = await this.supabase
          .from('meeting_transcripts')
          .select('*')
          .in('meeting_id', userData.meetings.map(m => m.id));

        userData.transcripts = transcripts || [];
      }

      // Get consent records
      if (dataCategories.includes('identity')) {
        const { data: consents } = await this.supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', userId);

        userData.consents = consents || [];
      }

      // Get audit logs (user-visible only)
      if (dataCategories.includes('technical')) {
        userData.audit_logs = await this.auditLogger.getUserAuditLogs(userId, 1000);
      }

    } catch (error) {
      console.error('Error collecting user data:', error);
    }

    return userData;
  }

  /**
   * Generate export file in requested format
   */
  private async generateExportFile(
    userData: ExportableData,
    format: 'json' | 'csv' | 'xml'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(userData, null, 2);
      
      case 'csv':
        return this.generateCSVExport(userData);
      
      case 'xml':
        return this.generateXMLExport(userData);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV export
   */
  private generateCSVExport(userData: ExportableData): string {
    let csv = '';

    // Profile section
    csv += 'PROFILE\n';
    csv += 'Field,Value\n';
    csv += `ID,${userData.profile.id}\n`;
    csv += `Email,${userData.profile.email}\n`;
    csv += `Created At,${userData.profile.created_at}\n`;
    csv += `Last Sign In,${userData.profile.last_sign_in_at || 'N/A'}\n\n`;

    // Meetings section
    csv += 'MEETINGS\n';
    csv += 'ID,Title,Status,Scheduled Date,Created At\n';
    userData.meetings.forEach(meeting => {
      csv += `${meeting.id},"${meeting.title}",${meeting.status},${meeting.scheduled_date},${meeting.created_at}\n`;
    });
    csv += '\n';

    // Transcripts section
    csv += 'TRANSCRIPTS\n';
    csv += 'ID,Meeting ID,Speaker,Timestamp,Content Preview\n';
    userData.transcripts.forEach(transcript => {
      const preview = transcript.content.substring(0, 100).replace(/"/g, '""');
      csv += `${transcript.id},${transcript.meeting_id},"${transcript.speaker || 'Unknown'}",${transcript.timestamp},"${preview}..."\n`;
    });

    return csv;
  }

  /**
   * Generate XML export
   */
  private generateXMLExport(userData: ExportableData): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<user_data>\n';
    
    // Profile
    xml += '  <profile>\n';
    xml += `    <id>${userData.profile.id}</id>\n`;
    xml += `    <email>${userData.profile.email}</email>\n`;
    xml += `    <created_at>${userData.profile.created_at}</created_at>\n`;
    xml += `    <last_sign_in_at>${userData.profile.last_sign_in_at || ''}</last_sign_in_at>\n`;
    xml += '  </profile>\n';

    // Meetings
    xml += '  <meetings>\n';
    userData.meetings.forEach(meeting => {
      xml += '    <meeting>\n';
      xml += `      <id>${meeting.id}</id>\n`;
      xml += `      <title><![CDATA[${meeting.title}]]></title>\n`;
      xml += `      <status>${meeting.status}</status>\n`;
      xml += `      <scheduled_date>${meeting.scheduled_date}</scheduled_date>\n`;
      xml += `      <created_at>${meeting.created_at}</created_at>\n`;
      xml += '    </meeting>\n';
    });
    xml += '  </meetings>\n';

    xml += '</user_data>';
    return xml;
  }

  /**
   * Upload export file to secure storage
   */
  private async uploadExportFile(fileContent: string, exportId: string): Promise<string> {
    // In production, upload to secure cloud storage
    // For this example, we'll return a placeholder URL
    return `https://secure-exports.collabai.com/exports/${exportId}.json`;
  }

  /**
   * Notify user that export is ready
   */
  private async notifyUserExportReady(userId: string, exportId: string): Promise<void> {
    // In production, send email notification or in-app notification
    console.log(`Data export ${exportId} ready for user ${userId}`);
  }

  /**
   * Get user's export history
   */
  async getUserExports(userId: string): Promise<UserDataExport[]> {
    try {
      const { data, error } = await this.supabase
        .from('data_exports')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Failed to get user exports:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user exports:', error);
      return [];
    }
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string, userId: string): Promise<string | null> {
    try {
      const { data: exportRequest, error } = await this.supabase
        .from('data_exports')
        .select('*')
        .eq('export_id', exportId)
        .eq('user_id', userId)
        .single();

      if (error || !exportRequest) {
        return null;
      }

      if (exportRequest.status !== 'completed') {
        throw new Error('Export is not ready for download');
      }

      if (new Date() > new Date(exportRequest.expires_at)) {
        throw new Error('Export has expired');
      }

      // Log download access
      await this.auditLogger.logDataAccess(
        userId,
        'data_export',
        exportId,
        'read',
        exportRequest.data_categories
      );

      return exportRequest.download_url || null;
    } catch (error) {
      console.error('Error downloading export:', error);
      return null;
    }
  }

  private updateExportStatus(exportId: string, status: string): Promise<void> {
    return this.supabase
      .from('data_exports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('export_id', exportId)
      .then(() => {});
  }

  private getAllDataCategories(): string[] {
    return ['identity', 'contact', 'behavioral', 'biometric', 'technical'];
  }
}
