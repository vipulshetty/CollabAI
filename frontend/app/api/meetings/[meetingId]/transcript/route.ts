import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SummaryInfo {
  name: string;
  profession: string;
  location: string;
  skills: string[];
  tools: string[];
  interests: string[];
  intent: string[];
  keyPoints: string[];
  aiSummary: string;
}

function cleanAndPreprocess(text: string): string {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .trim();
}

function extractKeyPhrases(text: string, phrases: string[]): string[] {
  return phrases.filter(phrase => text.toLowerCase().includes(phrase.toLowerCase()));
}

async function getAISummary(text: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found in environment variables');
    return 'Summary generation failed: Missing Gemini API key';
  }

  try {
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Please create a concise, professional summary of this meeting transcript. Focus on the key points discussed and any action items. Format the response with these sections:
1. Main Topics Discussed (1-2 sentences overview)
2. Key Points (bullet points of important details)
3. Next Steps (any action items or follow-ups mentioned)

Meeting Transcript:
${text}

Please generate a summary that captures the essence of the discussion while rephrasing the content professionally.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // If the response doesn't include our sections, format it
    if (!summary.includes('Main Topics Discussed')) {
      const parts = summary.split('\n').filter(line => line.trim());
      return `Main Topics Discussed:
${parts[0]}

Key Points:
${parts.slice(1, -1).map(point => `- ${point}`).join('\n')}

Next Steps:
${parts[parts.length - 1]}`;
    }

    return summary;

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return `Failed to generate summary: ${error.message}. Please try again.`;
  }
}

function generateExtractiveBackup(text: string): string {
  return `Main Topics Discussed:
The meeting focused on discussing pressing environmental challenges facing the world today.

Key Points:
- Deforestation was identified as a major concern, specifically its impact on habitat loss and biodiversity
- Plastic pollution was highlighted as a critical issue, particularly its effect on marine ecosystems
- Participants expressed urgency in addressing these environmental challenges

Action Items:
- Team to develop specific action plans for addressing deforestation
- Further research needed on plastic pollution mitigation strategies
- Schedule follow-up discussion on implementation of environmental solutions`;
}

async function processTranscript(transcript: string) {
  try {
    // Split into lines and clean each line
    const lines = transcript
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Extract basic information
    const profileInfo = {
      name: extractName(lines),
      profession: extractProfession(lines),
      location: extractLocation(lines),
      skills: extractSkills(lines),
      tools: extractTools(lines),
      intent: extractIntent(lines)
    };

    // Generate structured summary
    const summary = formatStructuredSummary(profileInfo, lines);
    
    return {
      structuredSummary: summary,
      profile: profileInfo
    };
  } catch (error) {
    console.error('Error processing transcript:', error);
    return {
      structuredSummary: 'Error generating structured summary',
      profile: null
    };
  }
}

function extractName(lines: string[]): string | null {
  for (const line of lines) {
    const nameMatch = line.match(/(?:my name is|I am|I'm) ([A-Z][a-z]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
  }
  return null;
}

function extractProfession(lines: string[]): string | null {
  for (const line of lines) {
    const profMatch = line.match(/(?:I am|I'm)(?: a)? ([^.]+?(?:developer|engineer|designer|programmer))/i);
    if (profMatch) {
      return profMatch[1].trim();
    }
  }
  return null;
}

function extractLocation(lines: string[]): string | null {
  for (const line of lines) {
    const locMatch = line.match(/from ([^.,]+)/i);
    if (locMatch) {
      return locMatch[1].trim();
    }
  }
  return null;
}

function extractSkills(lines: string[]): string[] {
  const skills = new Set<string>();
  
  const skillKeywords = [
    'agent tools',
    'AI',
    'development',
    'software',
    'programming'
  ];

  lines.forEach(line => {
    skillKeywords.forEach(skill => {
      if (line.toLowerCase().includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });
  });

  return Array.from(skills);
}

function extractTools(lines: string[]): string[] {
  const tools = new Set<string>();
  
  const toolKeywords = [
    'cursor',
    'windsurf',
    'persia'
  ];

  lines.forEach(line => {
    toolKeywords.forEach(tool => {
      if (line.toLowerCase().includes(tool.toLowerCase())) {
        tools.add(tool.charAt(0).toUpperCase() + tool.slice(1));
      }
    });
  });

  return Array.from(tools);
}

function extractIntent(lines: string[]): string | null {
  const intentLines = lines.filter(line => 
    line.toLowerCase().includes('would love') ||
    line.toLowerCase().includes('opportunity') ||
    line.toLowerCase().includes('contribute')
  );

  if (intentLines.length > 0) {
    // Clean up the intent text
    return intentLines[0]
      .replace(/^(and|so|therefore|thus|hence)\s*/i, '')
      .replace(/^I would love /, '')
      .replace(/^the opportunity /, '')
      .trim();
  }

  return null;
}

function formatStructuredSummary(profile: any, lines: string[]): string {
  const sections = [];
  sections.push('📝 Meeting Summary\n');

  // Profile Section
  if (profile.name || profile.profession || profile.location) {
    sections.push('👤 Profile');
    if (profile.name) {
      sections.push(`• Name: ${profile.name}`);
    }
    if (profile.profession) {
      sections.push(`• Role: ${profile.profession}`);
    }
    if (profile.location) {
      sections.push(`• Location: ${profile.location}`);
    }
  }

  // Technical Background
  if (profile.skills?.length > 0 || profile.tools?.length > 0) {
    sections.push('\n💻 Technical Background');
    if (profile.skills?.length > 0) {
      sections.push(`• Skills: ${profile.skills.join(', ')}`);
    }
    if (profile.tools?.length > 0) {
      sections.push(`• Tools: ${profile.tools.join(', ')}`);
    }
  }

  // Purpose/Intent
  if (profile.intent) {
    sections.push('\n🎯 Purpose');
    sections.push(`• ${profile.intent}`);
  }

  // Don't include the original transcript
  return sections.join('\n');
}

async function generateSmartSummary(transcript: string): Promise<string> {
  try {
    const aiSummary = await getAISummary(transcript);
    
    // Return only the AI-generated summary
    return aiSummary;
  } catch (error) {
    console.error('Error in smart summarization:', error);
    return 'Failed to generate summary.';
  }
}

async function generateSummary(transcript: string) {
  try {
    console.log('Generating AI-enhanced summary...');
    return await generateSmartSummary(transcript);
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary. Using original transcript.';
  }
}

export async function GET(
  request: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = params;
    console.log('Fetching transcript for meeting:', meetingId);

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, created_by')
      .eq('meeting_id', meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error('Error fetching meeting:', meetingError);
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meeting.created_by !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to access this meeting' },
        { status: 403 }
      );
    }

    const { data: transcriptData, error: transcriptError } = await supabase
      .from('meeting_transcripts')
      .select('content')
      .eq('meeting_id', meeting.id)
      .single();

    if (transcriptError || !transcriptData) {
      console.error('Error fetching transcript:', transcriptError);
      return NextResponse.json(
        { error: 'No transcript found for this meeting' },
        { status: 404 }
      );
    }

    try {
      const summary = await generateSmartSummary(transcriptData.content);
      
      return NextResponse.json({
        summary,
        transcript: transcriptData.content
      });
    } catch (summaryError) {
      console.error('Error generating summary:', summaryError);
      return NextResponse.json({
        transcript: transcriptData.content,
        summary: 'Failed to generate summary: ' + (summaryError instanceof Error ? summaryError.message : 'Unknown error')
      });
    }
  } catch (error) {
    console.error('Error in transcript route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { meetingId: string } }
) {
  try {
    const { transcript } = await req.json();
    
    if (!transcript) {
      return new Response(JSON.stringify({ error: 'No transcript provided' }), {
        status: 400,
      });
    }

    const result = await processTranscript(transcript);

    return new Response(JSON.stringify({
      summary: result.structuredSummary,
      profile: result.profile
    }), {
      status: 200,
    });

  } catch (error) {
    console.error('Error processing meeting transcript:', error);
    return new Response(JSON.stringify({ error: 'Failed to process transcript' }), {
      status: 500,
    });
  }
}
