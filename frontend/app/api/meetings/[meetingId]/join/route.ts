import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return Response.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Use service role client to bypass RLS and find the meeting
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the meeting (handle potential duplicates)
    const { data: meetings, error: meetingError } = await serviceSupabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId);

    if (meetingError) {
      console.error('Error fetching meeting:', meetingError);
      return Response.json(
        { error: meetingError.message },
        { status: 500 }
      );
    }

    if (!meetings || meetings.length === 0) {
      return Response.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meetings.length > 1) {
      console.warn(`Multiple meetings found with ID ${meetingId}:`, meetings.length);
    }

    const meeting = meetings[0];

    // Parse current participants and add the new one if not already present
    const participants = Array.isArray(meeting.participants) 
      ? meeting.participants 
      : JSON.parse(meeting.participants || '[]');
      
    if (!participants.includes(user.email)) {
      participants.push(user.email);
    }

    // Update participants list and ensure status is valid using service role client
    const { error: updateError } = await serviceSupabase
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
