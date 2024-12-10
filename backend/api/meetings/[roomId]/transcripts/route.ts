import { NextResponse } from 'next/server';
import { Transcript } from '@/models/Transcript';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transcripts = await Transcript.find({ 
      meetingId: params.roomId 
    }).sort({ createdAt: -1 });

    return NextResponse.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
  }
}