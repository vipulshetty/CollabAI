import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    const { transcripts } = await request.json();
    if (!transcripts || !Array.isArray(transcripts)) {
      return NextResponse.json({ error: 'Invalid transcripts data' }, { status: 400 });
    }

    // Get the meeting to verify access
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError) {
      console.error('Error fetching meeting:', meetingError);
      return NextResponse.json(
        { error: meetingError.message },
        { status: 500 }
      );
    }

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Only allow meeting participants to save transcripts
    if (!meeting.participants.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Not authorized to save transcripts for this meeting' },
        { status: 403 }
      );
    }

    // Save the transcripts
    const { data: transcript, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .insert({
        meeting_id: meetingId,
        content: transcripts.join('\n'),
        speaker: session.user.email,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('Error saving transcript:', transcriptError);
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transcripts saved successfully',
      transcript
    });
  } catch (error) {
    console.error('Error saving transcripts:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save transcripts',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
