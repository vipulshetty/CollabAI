import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise summaries of meeting transcripts. Focus on key points, action items, and decisions made."
        },
        {
          role: "user",
          content: `Please summarize this meeting transcript:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content || 'No summary generated';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize route:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
