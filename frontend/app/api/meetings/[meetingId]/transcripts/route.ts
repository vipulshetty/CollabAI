import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    const { transcripts } = await request.json();
    if (!transcripts || !Array.isArray(transcripts)) {
      return NextResponse.json({ error: 'Invalid transcripts data' }, { status: 400 });
    }

    // Get the meeting to verify access
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError) {
      console.error('Error fetching meeting:', meetingError);
      return NextResponse.json(
        { error: meetingError.message },
        { status: 500 }
      );
    }

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Only allow meeting participants to save transcripts
    if (meeting.created_by !== user.id && !meeting.participants.includes(user.id)) {
      return NextResponse.json(
        { error: 'Not authorized to save transcripts for this meeting' },
        { status: 403 }
      );
    }

    // Save the transcripts - handle both array and string formats
    let transcriptRecords;

    if (Array.isArray(transcripts)) {
      // Handle array of individual transcripts
      transcriptRecords = transcripts.map((transcript, index) => ({
        meeting_id: meetingId,
        content: typeof transcript === 'string' ? transcript : transcript.transcript || transcript.content || transcript,
        speaker: user.email,
        timestamp: new Date(Date.now() + index * 1000).toISOString(), // Slight offset for ordering
      }));
    } else {
      // Handle single transcript or joined string
      transcriptRecords = [{
        meeting_id: meetingId,
        content: Array.isArray(transcripts) ? transcripts.join('\n') : transcripts,
        speaker: user.email,
        timestamp: new Date().toISOString(),
      }];
    }

    const { data: transcript, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .insert(transcriptRecords)
      .select();

    if (transcriptError) {
      console.error('Error saving transcript:', transcriptError);
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transcripts saved successfully',
      transcripts: transcript,
      count: transcript?.length || 0
    });
  } catch (error) {
    console.error('Error saving transcripts:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save transcripts',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Get all transcripts for the meeting
    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('timestamp', { ascending: true });

    if (transcriptError) {
      console.error('Error fetching transcripts:', transcriptError);
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcripts: transcripts || []
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
