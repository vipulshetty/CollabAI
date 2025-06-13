import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gdprCompliance } from '@/lib/gdpr';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...requestData } = body;

    // Validate action
    const validActions = ['export', 'deletion', 'consent_update'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Process GDPR request
    const result = await gdprCompliance.processGDPRRequest(
      user.id,
      action,
      requestData
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        requestId: result.requestId
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('GDPR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await gdprCompliance.getUserGDPRStatus(user.id);
        return NextResponse.json(status);

      case 'compliance-check':
        const complianceCheck = await gdprCompliance.runComplianceCheck();
        return NextResponse.json(complianceCheck);

      case 'audit-logs':
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const auditLogs = await gdprCompliance.audit.getUserAuditLogs(user.id, limit, offset);
        return NextResponse.json({ auditLogs });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GDPR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
