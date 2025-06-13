import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('DEBUG: Meeting lookup for:', {
      meetingId: params.meetingId,
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message
    });

    // Get all meetings (no filters) to see what's in the database
    const { data: allMeetings, error: allError } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('DEBUG: All recent meetings:', allMeetings);

    // Try to find the specific meeting
    const { data: specificMeeting, error: specificError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', params.meetingId);

    console.log('DEBUG: Specific meeting lookup:', {
      meetingId: params.meetingId,
      found: specificMeeting,
      error: specificError
    });

    // Check if there are any meetings with similar IDs
    const { data: similarMeetings, error: similarError } = await supabase
      .from('meetings')
      .select('*')
      .ilike('id', `%${params.meetingId.substring(0, 8)}%`);

    console.log('DEBUG: Similar meetings:', similarMeetings);

    return NextResponse.json({
      debug: {
        requestedMeetingId: params.meetingId,
        user: user ? { id: user.id, email: user.email } : null,
        authError: authError?.message,
        allRecentMeetings: allMeetings,
        specificMeeting: specificMeeting,
        specificError: specificError?.message,
        similarMeetings: similarMeetings,
        similarError: similarError?.message
      }
    });
  } catch (error) {
    console.error('DEBUG: Error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
