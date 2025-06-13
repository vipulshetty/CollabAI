import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('Unauthorized access attempt to recent meetings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent meetings with transcript information
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
      .eq('created_by', session.user.email)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching recent meetings from Supabase:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!meetings) {
      console.error('No meetings data returned from Supabase');
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error in GET /api/meetings/recent:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}