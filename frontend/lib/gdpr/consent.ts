import { createClient } from '@/lib/supabase/client';
import { GDPREncryption } from './encryption';

// GDPR Consent Management System
export enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  TRANSCRIPTION = 'transcription',
  AI_PROCESSING = 'ai_processing'
}

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  PENDING = 'pending'
}

export interface ConsentRecord {
  id?: string;
  user_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  granted_at?: string;
  withdrawn_at?: string;
  ip_address?: string;
  user_agent?: string;
  consent_token: string;
  legal_basis: string;
  purpose: string;
  data_categories: string[];
  retention_period?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  transcription: boolean;
  ai_processing: boolean;
}

export class ConsentManager {
  private supabase = createClient();

  /**
   * Record user consent for GDPR compliance
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    status: ConsentStatus,
    legalBasis: string,
    purpose: string,
    dataCategories: string[],
    retentionPeriod?: number
  ): Promise<ConsentRecord | null> {
    try {
      const consentToken = GDPREncryption.generateConsentToken();
      const now = new Date().toISOString();

      const consentRecord: ConsentRecord = {
        user_id: userId,
        consent_type: consentType,
        status,
        granted_at: status === ConsentStatus.GRANTED ? now : undefined,
        withdrawn_at: status === ConsentStatus.WITHDRAWN ? now : undefined,
        consent_token: consentToken,
        legal_basis: legalBasis,
        purpose,
        data_categories: dataCategories,
        retention_period: retentionPeriod,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await this.supabase
        .from('user_consents')
        .insert(consentRecord)
        .select()
        .single();

      if (error) {
        console.error('Failed to record consent:', error);
        return null;
      }

      // Log consent action for audit trail
      await this.logConsentAction(userId, consentType, status, consentToken);

      return data;
    } catch (error) {
      console.error('Error recording consent:', error);
      return null;
    }
  }

  /**
   * Get user's current consent preferences
   */
  async getUserConsents(userId: string): Promise<ConsentPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('consent_type, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get user consents:', error);
        return this.getDefaultConsents();
      }

      // Get the latest consent for each type
      const latestConsents = new Map<ConsentType, ConsentStatus>();
      data?.forEach(consent => {
        if (!latestConsents.has(consent.consent_type)) {
          latestConsents.set(consent.consent_type, consent.status);
        }
      });

      return {
        essential: true, // Always true for essential cookies
        analytics: latestConsents.get(ConsentType.ANALYTICS) === ConsentStatus.GRANTED,
        marketing: latestConsents.get(ConsentType.MARKETING) === ConsentStatus.GRANTED,
        personalization: latestConsents.get(ConsentType.PERSONALIZATION) === ConsentStatus.GRANTED,
        transcription: latestConsents.get(ConsentType.TRANSCRIPTION) === ConsentStatus.GRANTED,
        ai_processing: latestConsents.get(ConsentType.AI_PROCESSING) === ConsentStatus.GRANTED
      };
    } catch (error) {
      console.error('Error getting user consents:', error);
      return this.getDefaultConsents();
    }
  }

  /**
   * Update user consent preferences
   */
  async updateConsents(userId: string, preferences: ConsentPreferences): Promise<boolean> {
    try {
      const consentTypes = [
        { type: ConsentType.ANALYTICS, granted: preferences.analytics },
        { type: ConsentType.MARKETING, granted: preferences.marketing },
        { type: ConsentType.PERSONALIZATION, granted: preferences.personalization },
        { type: ConsentType.TRANSCRIPTION, granted: preferences.transcription },
        { type: ConsentType.AI_PROCESSING, granted: preferences.ai_processing }
      ];

      for (const consent of consentTypes) {
        const status = consent.granted ? ConsentStatus.GRANTED : ConsentStatus.DENIED;
        const legalBasis = consent.granted ? 'consent' : 'withdrawn_consent';
        
        await this.recordConsent(
          userId,
          consent.type,
          status,
          legalBasis,
          this.getConsentPurpose(consent.type),
          this.getDataCategories(consent.type),
          this.getRetentionPeriod(consent.type)
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating consents:', error);
      return false;
    }
  }

  /**
   * Withdraw all consents (for account deletion)
   */
  async withdrawAllConsents(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_consents')
        .update({
          status: ConsentStatus.WITHDRAWN,
          withdrawn_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .neq('status', ConsentStatus.WITHDRAWN);

      if (error) {
        console.error('Failed to withdraw consents:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error withdrawing consents:', error);
      return false;
    }
  }

  /**
   * Check if user has granted specific consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('status')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return consentType === ConsentType.ESSENTIAL; // Essential is always granted
      }

      return data.status === ConsentStatus.GRANTED;
    } catch (error) {
      console.error('Error checking consent:', error);
      return consentType === ConsentType.ESSENTIAL;
    }
  }

  private async logConsentAction(
    userId: string,
    consentType: ConsentType,
    status: ConsentStatus,
    consentToken: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'consent_update',
          resource_type: 'user_consent',
          resource_id: consentToken,
          details: {
            consent_type: consentType,
            status,
            timestamp: new Date().toISOString()
          },
          ip_address: null, // Will be populated by middleware
          user_agent: null, // Will be populated by middleware
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log consent action:', error);
    }
  }

  private getDefaultConsents(): ConsentPreferences {
    return {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      transcription: false,
      ai_processing: false
    };
  }

  private getConsentPurpose(consentType: ConsentType): string {
    const purposes = {
      [ConsentType.ESSENTIAL]: 'Essential functionality and security',
      [ConsentType.ANALYTICS]: 'Website analytics and performance monitoring',
      [ConsentType.MARKETING]: 'Marketing communications and promotions',
      [ConsentType.PERSONALIZATION]: 'Personalized content and recommendations',
      [ConsentType.TRANSCRIPTION]: 'Meeting transcription and recording',
      [ConsentType.AI_PROCESSING]: 'AI-powered features and content analysis'
    };
    return purposes[consentType];
  }

  private getDataCategories(consentType: ConsentType): string[] {
    const categories = {
      [ConsentType.ESSENTIAL]: ['technical', 'identity'],
      [ConsentType.ANALYTICS]: ['behavioral', 'technical'],
      [ConsentType.MARKETING]: ['contact', 'behavioral'],
      [ConsentType.PERSONALIZATION]: ['behavioral', 'identity'],
      [ConsentType.TRANSCRIPTION]: ['biometric', 'behavioral'],
      [ConsentType.AI_PROCESSING]: ['behavioral', 'biometric']
    };
    return categories[consentType];
  }

  private getRetentionPeriod(consentType: ConsentType): number {
    const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '2555'); // 7 years default
    
    const periods = {
      [ConsentType.ESSENTIAL]: 30, // 30 days for essential
      [ConsentType.ANALYTICS]: 730, // 2 years for analytics
      [ConsentType.MARKETING]: 1095, // 3 years for marketing
      [ConsentType.PERSONALIZATION]: 365, // 1 year for personalization
      [ConsentType.TRANSCRIPTION]: retentionDays, // Business record retention
      [ConsentType.AI_PROCESSING]: retentionDays // Business record retention
    };
    
    return periods[consentType];
  }
}
