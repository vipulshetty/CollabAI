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

    // Get the meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('meeting_id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Parse current participants and add the new one if not already present
    let participants = JSON.parse(meeting.participants || '[]');
    if (!participants.includes(session.user.email)) {
      participants.push(session.user.email);
    }

    // Update the meeting with the new participant
    const { error: updateError } = await supabase
      .from('meetings')
      .update({
        participants: JSON.stringify(participants),
        updated_at: new Date().toISOString()
      })
      .eq('meeting_id', meetingId);

    if (updateError) {
      console.error('Error updating participants:', updateError);
      return NextResponse.json(
        { error: 'Failed to join meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      meeting: {
        ...meeting,
        participants
      }
    });
  } catch (error) {
    console.error('Error in POST /api/meetings/[meetingId]/join:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
