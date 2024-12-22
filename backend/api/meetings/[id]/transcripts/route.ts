
import { NextResponse } from 'next/server';
import { saveTranscripts, getTranscripts } from '@/services/transcriptStorage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const transcripts = await getTranscripts(params.id);
  return NextResponse.json({ transcripts });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { transcripts } = await request.json();
  const success = await saveTranscripts(params.id, transcripts);
  
  if (success) {
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json(
    { error: 'Failed to save transcripts' },
    { status: 500 }
  );
}