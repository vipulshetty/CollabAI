import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating instant meeting for user:', user.email, 'ID:', user.id);

    // Create instant meeting
    const meetingData = {
      title: `Instant Meeting - ${new Date().toLocaleString()}`,
      status: 'scheduled',
      scheduled_date: new Date().toISOString(),
      created_by: user.id,
      participants: [user.email], // Simple text array
      description: 'Instant meeting created from dashboard',
      meeting_url: null // Will be updated after we get the ID
    };

    console.log('Meeting data to insert:', meetingData);

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating meeting:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create meeting' },
        { status: 500 }
      );
    }

    console.log('Meeting created successfully:', meeting);

    // Update the meeting with the proper URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                   process.env.FRONTEND_URL ||
                   'https://collabai-frontend.vercel.app';
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
      return NextResponse.json({ 
        meeting,
        meetingId: meeting.id,
        redirectUrl: meetingUrl
      });
    }

    console.log('Meeting URL updated:', updatedMeeting);

    return NextResponse.json({ 
      meeting: updatedMeeting,
      meetingId: updatedMeeting.id,
      redirectUrl: meetingUrl
    });
  } catch (error) {
    console.error('Error in POST /api/meetings/instant:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
