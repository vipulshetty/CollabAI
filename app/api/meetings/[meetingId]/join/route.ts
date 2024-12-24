import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return Response.json({ error: 'Meeting ID is required' }, { status: 400 });
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

    // Parse current participants and add the new one if not already present
    const participants = Array.isArray(meeting.participants) 
      ? meeting.participants 
      : JSON.parse(meeting.participants || '[]');
      
    if (!participants.includes(session.user.email)) {
      participants.push(session.user.email);
    }

    // Update participants list and ensure status is valid
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        participants,
        status: meeting.status === 'scheduled' ? 'scheduled' : meeting.status // Keep existing status if not scheduled
      })
      .eq('id', meetingId);

    if (updateError) {
      console.error('Error updating participants:', updateError);
      return Response.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      meeting: {
        ...meeting,
        participants
      }
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
