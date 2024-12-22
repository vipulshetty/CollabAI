import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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

    const client = await clientPromise;
    const db = client.db('collabai');
    
    // Handle both formats: with and without 'meeting-' prefix
    const roomIdWithoutPrefix = params.roomId.replace('meeting-', '');
    const possibleRoomIds = [
      params.roomId,
      `meeting-${roomIdWithoutPrefix}`,
      roomIdWithoutPrefix
    ];
    
    console.log('Querying summaries for roomIds:', possibleRoomIds);
    
    const summaries = await db.collection('summaries')
      .find({
        roomId: { $in: possibleRoomIds },
        $or: [
          { createdBy: session.user.email },
          { participants: session.user.email }
        ]
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`Found ${summaries.length} summaries`);
    
    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 });
  }
} 