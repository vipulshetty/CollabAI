import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    meetingId: string;
  };
};

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = context.params;
    if (!meetingId) {
      return Response.json({ error: 'Meeting ID is required' }, { status: 400 });
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
      return Response.json(
        { error: meetingError.message },
        { status: 500 }
      );
    }

    if (!meeting) {
      return Response.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Only allow the meeting creator or participants to end it
    if (meeting.created_by !== user.id && !meeting.participants.includes(user.id)) {
      return Response.json(
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
      console.error('Error updating meeting:', updateError);
      return Response.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // If transcript is provided, save it
    if (transcript) {
      const { error: transcriptError } = await supabase
        .from('meeting_transcripts')
        .insert({
          meeting_id: meetingId,
          content: transcript,
          speaker: user.email,
          timestamp: new Date().toISOString()
        });

      if (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
        // Don't return error, as meeting was ended successfully
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error ending meeting:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
