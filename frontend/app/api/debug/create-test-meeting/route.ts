import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a test meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title: 'Test Meeting with Transcript',
        description: 'This is a test meeting to verify transcript functionality',
        status: 'completed',
        scheduled_date: new Date().toISOString(),
        created_by: user.id,
        participants: [user.id]
      })
      .select()
      .single();

    if (meetingError) {
      console.error('Error creating test meeting:', meetingError);
      return NextResponse.json({ error: meetingError.message }, { status: 500 });
    }

    // Create test transcripts
    const testTranscripts = [
      {
        meeting_id: meeting.id,
        content: 'Hello everyone, welcome to our test meeting.',
        speaker: user.email,
        timestamp: new Date().toISOString()
      },
      {
        meeting_id: meeting.id,
        content: 'Today we will discuss the new project requirements and timeline.',
        speaker: user.email,
        timestamp: new Date(Date.now() + 5000).toISOString()
      },
      {
        meeting_id: meeting.id,
        content: 'We need to complete the design phase by next Friday.',
        speaker: user.email,
        timestamp: new Date(Date.now() + 10000).toISOString()
      }
    ];

    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .insert(testTranscripts)
      .select();

    if (transcriptError) {
      console.error('Error creating test transcripts:', transcriptError);
      return NextResponse.json({ error: transcriptError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting,
      transcripts,
      message: 'Test meeting and transcripts created successfully'
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { error: 'Failed to create test data' },
      { status: 500 }
    );
  }
}
