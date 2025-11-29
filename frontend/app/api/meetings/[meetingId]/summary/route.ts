import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GeminiService } from '@/services/GeminiService';

const geminiService = new GeminiService();

export const maxDuration = 60; // Increase timeout for AI generation

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

    // Get meeting and its transcripts with existing summary
    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('id, content, summary, speaker, timestamp')
      .eq('meeting_id', params.meetingId)
      .order('timestamp', { ascending: true });

    if (transcriptError) {
      console.error('Error fetching transcripts:', transcriptError);
      return NextResponse.json({ error: transcriptError.message }, { status: 500 });
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({
        summary: 'This meeting has been completed but no transcripts were recorded. This could be because transcription was not enabled during the meeting.',
        actionPoints: ['Review meeting notes manually', 'Follow up with participants for key decisions']
      });
    }

    // If summary already exists, return it
    const existingSummary = transcripts[0]?.summary;
    if (existingSummary) {
      return NextResponse.json({
        summary: existingSummary,
        actionPoints: await generateActionPoints(transcripts.map(t => t.content).join('\n'))
      });
    }

    // Generate new summary if none exists
    const allContent = transcripts.map(t => t.content);
    let summary: string;
    let actionPoints: string[] = [];

    try {
      // Run AI generation in parallel to save time
      const [generatedSummary, generatedActionPoints] = await Promise.all([
        geminiService.generateSummary(allContent),
        generateActionPoints(allContent.join('\n'))
      ]);

      summary = generatedSummary;
      actionPoints = generatedActionPoints;

      // Save the generated summary and action points to the database
      // This ensures we don't regenerate it next time (saving API costs and avoiding rate limits)
      const { error: updateError } = await supabase
        .from('meeting_transcripts')
        .update({ summary }) // Note: We're updating all transcripts for this meeting with the same summary
        .eq('meeting_id', params.meetingId);

      if (updateError) {
        console.error('Error saving generated summary:', updateError);
        // We continue even if saving fails, so the user still sees the summary
      }
    } catch (error) {
      console.error('Error generating AI content:', error);

      // Fallback summary based on transcript content
      const transcriptText = allContent.join('\n');
      const wordCount = transcriptText.split(' ').length;
      const speakerCount = new Set(transcripts.map(t => t.speaker || 'Unknown')).size;

      summary = `📋 Meeting Summary (AI-Generated Fallback)

📊 Meeting Statistics:
• Duration: Approximately ${Math.ceil(wordCount / 150)} minutes (based on ${wordCount} words)
• Participants: ${speakerCount} speaker${speakerCount > 1 ? 's' : ''}
• Transcript segments: ${transcripts.length}

💬 Key Discussion Points:
${generateKeyPoints(transcriptText)}

📝 Meeting Content Preview:
"${transcriptText.length > 300 ? transcriptText.substring(0, 300) + '...' : transcriptText}"

✨ This summary was generated using intelligent text analysis. For the complete discussion, please review the full transcript below.`;

      // Fallback action points based on transcript content
      actionPoints = generateFallbackActionPoints(transcriptText);
    }

    return NextResponse.json({
      summary,
      actionPoints
    });

  } catch (error) {
    console.error('Error getting summary:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

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

    // Get all transcripts for the meeting
    const { data: transcripts, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('id, content')
      .eq('meeting_id', params.meetingId)
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
      .eq('meeting_id', params.meetingId);

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

async function generateActionPoints(transcript: string): Promise<string[]> {
  try {
    // Use Gemini AI to extract action items intelligently
    const prompt = `
    Analyze the following meeting transcript and extract specific action items or tasks that need to be completed.
    Focus on concrete, actionable items with clear ownership or next steps.

    Transcript:
    ${transcript}

    Please provide a list of action items in this format:
    - [Action item 1]
    - [Action item 2]
    - [Action item 3]

    If no clear action items are found, suggest 2-3 potential follow-up tasks based on the discussion.
    Focus only on what was actually discussed in the meeting.
    `;

    const response = await geminiService.generateText(prompt);

    // Parse the response to extract action items and clean formatting
    let actionItems = response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .map(line => line.replace(/\*\*(.*?)\*\*/g, '$1')) // Remove bold markdown
      .map(line => line.replace(/\*(.*?)\*/g, '$1'))     // Remove italic markdown
      .filter(item => item.length > 0)
      .slice(0, 4);

    return actionItems.length > 0 ? actionItems : [
      'Review meeting notes and key decisions',
      'Follow up with participants on discussed topics',
      'Schedule next meeting if needed',
      'Document important decisions made during the meeting'
    ];
  } catch (error) {
    console.error('Error generating action points with AI:', error);

    // Fallback to keyword-based extraction
    return generateFallbackActionPoints(transcript);
  }
}

async function extractKeyTopics(transcript: string): Promise<string[]> {
  try {
    // Use Gemini AI to extract key topics intelligently
    const prompt = `
    Analyze the following meeting transcript and identify the main topics, themes, or subjects that were discussed.
    Focus on the most important and relevant topics that capture the essence of the meeting.

    Transcript:
    ${transcript}

    Please provide a list of 3-5 key topics in this format:
    - [Topic 1]
    - [Topic 2]
    - [Topic 3]

    Topics should be concise phrases or single words that represent the main discussion points.
    `;

    const response = await geminiService.generateText(prompt);

    // Parse the response to extract key topics
    const topics = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(topic => topic.length > 0)
      .slice(0, 5);

    return topics.length > 0 ? topics : ['General Discussion', 'Team Meeting', 'Project Updates'];
  } catch (error) {
    console.error('Error extracting key topics with AI:', error);

    // Fallback to word frequency analysis
    const words = transcript.toLowerCase().split(/\s+/);
    const wordCount: { [key: string]: number } = {};

    // Count word frequency (excluding common words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    }

    // Get top 5 most frequent words as key topics
    const sortedWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return sortedWords.length > 0 ? sortedWords : ['Meeting', 'Discussion', 'Updates'];
  }
}

function generateKeyPoints(transcript: string): string {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keyPoints = sentences
    .slice(0, 3)
    .map((sentence, index) => `• ${sentence.trim()}`)
    .join('\n');

  return keyPoints || '• General discussion and team collaboration';
}

function generateFallbackActionPoints(transcript: string): string[] {
  const lowerTranscript = transcript.toLowerCase();
  const actionPoints: string[] = [];

  // Look for common action-oriented phrases
  if (lowerTranscript.includes('follow up') || lowerTranscript.includes('follow-up')) {
    actionPoints.push('Follow up on discussed items');
  }

  if (lowerTranscript.includes('next meeting') || lowerTranscript.includes('schedule')) {
    actionPoints.push('Schedule next meeting');
  }

  if (lowerTranscript.includes('review') || lowerTranscript.includes('check')) {
    actionPoints.push('Review meeting outcomes and decisions');
  }

  if (lowerTranscript.includes('share') || lowerTranscript.includes('send')) {
    actionPoints.push('Share meeting summary with team members');
  }

  if (lowerTranscript.includes('contact') || lowerTranscript.includes('reach out')) {
    actionPoints.push('Contact relevant team members about discussed topics');
  }

  if (lowerTranscript.includes('fix') || lowerTranscript.includes('resolve') || lowerTranscript.includes('issue')) {
    actionPoints.push('Address and resolve identified issues');
  }

  // Add default action points if we have less than 3
  if (actionPoints.length < 3) {
    actionPoints.push(
      'Document key decisions from this meeting',
      'Share meeting outcomes with relevant stakeholders',
      'Review and implement discussed solutions'
    );
  }

  return actionPoints.slice(0, 4); // Limit to 4 action points
}
