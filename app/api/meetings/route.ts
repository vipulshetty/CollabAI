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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .or(`created_by.eq.${session.user.email},participants.cs.{${session.user.email}}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meetings: meetings || [] });
  } catch (error) {
    console.error('Error in GET /api/meetings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, scheduled_date } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Meeting title is required' },
        { status: 400 }
      );
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        title,
        status: status || 'scheduled',
        scheduled_date: scheduled_date || new Date().toISOString(),
        created_by: session.user.email,
        participants: [session.user.email],
        description: description || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create meeting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error in POST /api/meetings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}