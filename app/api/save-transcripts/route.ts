import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { meetingId, transcripts } = await req.json();

    if (!meetingId || !transcripts) {
      return NextResponse.json(
        { error: 'Meeting ID and transcripts are required' },
        { status: 400 }
      );
    }

    // TODO: Add your database save logic here
    // For now, we'll just log the data
    console.log('Saving transcripts:', { meetingId, transcripts });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Transcripts saved successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to save transcripts' },
      { status: 500 }
    );
  }
}