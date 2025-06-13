import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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
    if (!meeting.participants.includes(session.user.email)) {
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
          speaker: session.user.email,
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
