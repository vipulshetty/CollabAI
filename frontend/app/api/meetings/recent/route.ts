import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('collabai');
    
    const meetings = await db.collection('meetings')
      .find({
        $or: [
          { createdBy: session.user.email },
          { participants: session.user.email }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Enhance meetings with summary and transcript info
    const enhancedMeetings = await Promise.all(meetings.map(async (meeting) => {
      const summary = await db.collection('summaries')
        .findOne({ roomId: meeting._id.toString() });
        
      const transcript = await db.collection('transcripts')
        .findOne({ roomId: meeting._id.toString() });

      return {
        id: meeting._id.toString(),
        title: meeting.title,
        createdAt: meeting.createdAt,
        status: meeting.status,
        participants: meeting.participants || [],
        hasSummary: !!summary,
        hasTranscripts: !!transcript
      };
    }));

    return NextResponse.json(enhancedMeetings);
  } catch (error) {
    console.error('Error fetching recent meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
} 