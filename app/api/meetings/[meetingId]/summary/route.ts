import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { createClient } from '@supabase/supabase-js';
import { GeminiService } from '@/services/GeminiService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const geminiService = new GeminiService();

export async function POST(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Get all transcripts for the meeting
    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('id, content')
      .eq('meeting_id', meetingId)
      .order('timestamp', { ascending: true });

    if (transcriptError) {
      console.error('Error fetching transcripts:', transcriptError);
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 500 }
      );
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json(
        { error: 'No transcripts found for this meeting' },
        { status: 404 }
      );
    }

    // Combine all transcripts for summary
    const allContent = transcripts.map(t => t.content);

    // Generate summary using Gemini
    const summary = await geminiService.generateSummary(allContent);

    // Update all transcript records with the same summary
    const { error: updateError } = await supabase
      .from('meeting_transcripts')
      .update({ summary })
      .eq('meeting_id', meetingId);

    if (updateError) {
      console.error('Error saving summary:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
