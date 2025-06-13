import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger, AuditAction, AuditSeverity } from './audit';

/**
 * GDPR Audit Middleware
 * Automatically logs user activities for compliance and transparency
 */
export class GDPRAuditMiddleware {
  private auditLogger = new AuditLogger();

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    request: NextRequest,
    response: NextResponse,
    action: 'login' | 'logout' | 'signup'
  ): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await this.auditLogger.log(
          action === 'login' ? AuditAction.LOGIN :
          action === 'logout' ? AuditAction.LOGOUT :
          AuditAction.ACCOUNT_CREATE,
          'user_session',
          {
            user_agent: request.headers.get('user-agent'),
            ip_address: this.getClientIP(request),
            timestamp: new Date().toISOString()
          },
          user.id,
          undefined,
          AuditSeverity.MEDIUM
        );
      }
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    request: NextRequest,
    userId: string,
    resourceType: string,
    resourceId?: string,
    dataCategories: string[] = []
  ): Promise<void> {
    try {
      const method = request.method;
      const accessType = method === 'GET' ? 'read' : 
                        method === 'POST' || method === 'PUT' || method === 'PATCH' ? 'write' :
                        method === 'DELETE' ? 'delete' : 'unknown';

      await this.auditLogger.logDataAccess(
        userId,
        resourceType,
        resourceId || 'unknown',
        accessType,
        dataCategories
      );
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  /**
   * Log meeting-related activities
   */
  async logMeetingActivity(
    userId: string,
    action: 'create' | 'join' | 'leave' | 'record' | 'transcript',
    meetingId: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const auditAction = action === 'create' ? AuditAction.MEETING_CREATE :
                         action === 'join' ? AuditAction.MEETING_JOIN :
                         action === 'transcript' ? AuditAction.TRANSCRIPT_ACCESS :
                         AuditAction.DATA_ACCESS;

      await this.auditLogger.log(
        auditAction,
        'meeting',
        {
          meeting_action: action,
          meeting_id: meetingId,
          ...details
        },
        userId,
        meetingId,
        AuditSeverity.MEDIUM
      );
    } catch (error) {
      console.error('Failed to log meeting activity:', error);
    }
  }

  /**
   * Log AI processing activities
   */
  async logAIProcessing(
    userId: string,
    processingType: string,
    inputData: string[],
    outputData: string[],
    model: string,
    meetingId?: string
  ): Promise<void> {
    try {
      await this.auditLogger.logAIProcessing(
        userId,
        processingType,
        inputData,
        outputData,
        model
      );
    } catch (error) {
      console.error('Failed to log AI processing:', error);
    }
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
  ): Promise<void> {
    try {
      await this.auditLogger.logConsentChange(
        userId,
        consentType,
        oldStatus,
        newStatus,
        legalBasis
      );
    } catch (error) {
      console.error('Failed to log consent change:', error);
    }
  }

  /**
   * Enhanced middleware function for Next.js
   */
  async enhanceResponse(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    try {
      // Add GDPR compliance headers
      response.headers.set('X-GDPR-Compliant', 'true');
      response.headers.set('X-Privacy-Policy', '/privacy');
      response.headers.set('X-Data-Controller', 'CollabAI Platform');

      // Add security headers for data protection
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add CSP header for additional security
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://alkkrjkoyxlbwtkyklde.supabase.co wss://alkkrjkoyxlbwtkyklde.supabase.co",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);

      return response;
    } catch (error) {
      console.error('Failed to enhance response with GDPR headers:', error);
      return response;
    }
  }

  /**
   * Check if request requires consent
   */
  async requiresConsent(
    request: NextRequest,
    userId?: string
  ): Promise<{
    required: boolean;
    consentTypes: string[];
    reason: string;
  }> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Define routes that require specific consents
    const consentRequirements = {
      '/api/meetings': {
        consentTypes: ['transcription'],
        reason: 'Meeting recording and transcription'
      },
      '/api/ai': {
        consentTypes: ['ai_processing'],
        reason: 'AI-powered content analysis'
      },
      '/api/analytics': {
        consentTypes: ['analytics'],
        reason: 'Usage analytics and performance monitoring'
      }
    };

    for (const [route, requirements] of Object.entries(consentRequirements)) {
      if (pathname.startsWith(route)) {
        if (userId) {
          // Check if user has granted required consents
          try {
            const supabase = createClient();
            const { data: consents } = await supabase
              .from('user_consents')
              .select('consent_type, status')
              .eq('user_id', userId)
              .in('consent_type', requirements.consentTypes)
              .eq('status', 'granted');

            const grantedConsents = consents?.map(c => c.consent_type) || [];
            const missingConsents = requirements.consentTypes.filter(
              type => !grantedConsents.includes(type)
            );

            return {
              required: missingConsents.length > 0,
              consentTypes: missingConsents,
              reason: requirements.reason
            };
          } catch (error) {
            console.error('Failed to check consent requirements:', error);
            return {
              required: true,
              consentTypes: requirements.consentTypes,
              reason: requirements.reason
            };
          }
        }

        return {
          required: true,
          consentTypes: requirements.consentTypes,
          reason: requirements.reason
        };
      }
    }

    return {
      required: false,
      consentTypes: [],
      reason: ''
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    return 'unknown';
  }

  /**
   * Anonymize IP address for privacy
   */
  private anonymizeIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return 'anonymized';
  }
}

// Export singleton instance
export const gdprAuditMiddleware = new GDPRAuditMiddleware();
