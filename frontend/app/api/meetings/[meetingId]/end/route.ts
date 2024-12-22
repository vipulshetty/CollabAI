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

    let transcript;
    try {
      const body = await request.json();
      transcript = body.transcript;
    } catch (error) {
      // If parsing fails, continue without transcript
      console.log('No transcript provided');
    }

    // Get the meeting
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

    // Only allow the meeting creator or participants to end it
    if (!meeting.participants.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Not authorized to end this meeting' },
        { status: 403 }
      );
    }

    // Update meeting status to completed
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating meeting status:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Save the transcript if provided
    if (transcript) {
      const { error: transcriptError } = await supabase
        .from('meeting_transcripts')
        .insert({
          meeting_id: meetingId,
          content: transcript,
          created_by: session.user.email
        });

      if (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
        // Continue even if transcript saving fails
      }
    }

    // Get the updated meeting
    const { data: updatedMeeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated meeting:', fetchError);
      // Continue even if fetching updated meeting fails
    }

    return NextResponse.json({
      success: true,
      message: 'Meeting ended successfully',
      meeting: updatedMeeting || meeting
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to end meeting',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
