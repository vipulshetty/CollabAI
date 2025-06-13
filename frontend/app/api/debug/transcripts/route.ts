import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get all transcripts to debug
    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    // Get all meetings to debug
    const { data: meetings, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      transcripts: transcripts || [],
      meetings: meetings || [],
      transcriptError,
      meetingError
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}
