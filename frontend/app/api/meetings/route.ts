import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for database operations to bypass RLS
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

    const { data: meetings, error } = await serviceSupabase
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
      .or(`created_by.eq.${user.id},participants.cs.{${user.email}}`)
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
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, scheduled_date, participants } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Meeting title is required' },
        { status: 400 }
      );
    }

    console.log('Creating meeting for user:', user.email, 'user.id:', user.id);
    console.log('Full user object:', JSON.stringify(user, null, 2));

    // Prepare participants array (text[] format)
    let participantsList: string[] = [user.email]; // Use email for participants
    if (participants && Array.isArray(participants) && participants.length > 0) {
      participantsList = [user.email, ...participants];
    }

    console.log('Creating meeting with participants:', participantsList);

    // Insert meeting into database
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        title,
        status: status || 'scheduled',
        scheduled_date: scheduled_date || new Date().toISOString(),
        created_by: user.id, // Use user.id for RLS
        participants: participantsList, // text[] array
        description: description || '',
        meeting_url: null // Will be updated after we get the ID
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

    // Update the meeting with the proper URL now that we have the ID
    // Determine the correct base URL based on environment
    let baseUrl;
    if (process.env.NODE_ENV === 'development') {
      // In development, use localhost
      baseUrl = 'http://localhost:3000';
    } else {
      // In production, use environment variables or fallback
      baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                process.env.FRONTEND_URL ||
                'https://collabai-frontend.vercel.app';
    }
    const meetingUrl = `${baseUrl}/meetings/${meeting.id}/video-call`;

    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update({ meeting_url: meetingUrl })
      .eq('id', meeting.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating meeting URL:', updateError);
      // Still return the meeting even if URL update fails
      meeting.meeting_url = meetingUrl;
      return NextResponse.json({ meeting });
    }

    console.log('Created meeting:', updatedMeeting);

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error in POST /api/meetings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}