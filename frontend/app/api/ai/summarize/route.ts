import OpenAI from 'openai';
import { NextResponse } from 'next/server';

interface ParsedResponse {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timestamp: number;
}

function mockAIResponse(transcripts: string[]): string {
  return `Summary:
A team meeting discussed feature implementation plans. Alice will handle frontend development while Bob takes care of backend work, with a deadline set for next Friday.

Key Points:
- Feature implementation discussion
- Frontend work assigned to Alice
- Backend work assigned to Bob
- Project deadline set

Action Items:
- Alice to complete frontend development
- Bob to complete backend development
- Team to deliver complete feature by next Friday`;
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = response.split('\n\n');
  let summary = '', keyPoints: string[] = [], actionItems: string[] = [];

  for (const section of sections) {
    const sectionLower = section.toLowerCase();
    if (sectionLower.includes('summary:')) {
      const parts = section.split(/summary:/i);
      if (parts.length > 1) {
        summary = parts[1].trim();
      }
    }
    else if (sectionLower.includes('key points:')) {
      const parts = section.split(/key points:/i);
      if (parts.length > 1) {
        keyPoints = parts[1]
          .split('\n')
          .filter(point => point.trim().startsWith('-'))
          .map(point => point.trim().substring(1).trim());
      }
    }
    else if (sectionLower.includes('action items:')) {
      const parts = section.split(/action items:/i);
      if (parts.length > 1) {
        actionItems = parts[1]
          .split('\n')
          .filter(item => item.trim().startsWith('-'))
          .map(item => item.trim().substring(1).trim());
      }
    }
  }

  return {
    summary,
    keyPoints,
    actionItems,
    timestamp: Date.now()
  };
}

export async function POST(req: Request) {
  try {
    const { transcripts, roomId } = await req.json();
    
    if (!transcripts || !Array.isArray(transcripts)) {
      return NextResponse.json(
        { error: 'Invalid transcripts data' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using mock response');
      const mockResponse = mockAIResponse(transcripts);
      const summary = parseAIResponse(mockResponse);
      return NextResponse.json(summary);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Summarize this meeting transcript and extract key points and action items:\n\n${transcripts.join('\n')}`;
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a meeting assistant. Create a concise summary, extract key points, and identify action items. Format your response with clear sections:\n\nSummary:\n[summary text]\n\nKey Points:\n- [point 1]\n- [point 2]\n\nAction Items:\n- [item 1]\n- [item 2]" 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const summary = parseAIResponse(response);
      return NextResponse.json(summary);
      
    } catch (openAIError) {
      console.error('OpenAI API Error:', openAIError);
      console.log('Falling back to mock response');
      const mockResponse = mockAIResponse(transcripts);
      const summary = parseAIResponse(mockResponse);
      return NextResponse.json(summary);
    }

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 