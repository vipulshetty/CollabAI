import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      console.error('Unauthorized access attempt to upcoming meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Get upcoming meetings
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        scheduled_date,
        created_at,
        status,
        created_by,
        participants,
        meeting_url,
        description
      `)
      .eq('created_by', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_date', now)
      .order('scheduled_date', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching upcoming meetings from Supabase:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!meetings) {
      console.error('No upcoming meetings data returned from Supabase');
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error in GET /api/meetings/upcoming:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
