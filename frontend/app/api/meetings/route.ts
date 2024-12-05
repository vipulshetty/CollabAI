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
      .aggregate([
        {
          $match: {
            $or: [
              { createdBy: session.user.email },
              { participants: session.user.email }
            ],
            status: { $in: ['ended', 'active'] }
          }
        },
        {
          $lookup: {
            from: 'transcripts',
            localField: '_id',
            foreignField: 'meetingId',
            as: 'transcripts'
          }
        },
        {
          $lookup: {
            from: 'summaries',
            localField: '_id',
            foreignField: 'meetingId',
            as: 'summaries'
          }
        },
        {
          $project: {
            _id: 1,
            id: 1,
            title: 1,
            status: 1,
            date: 1,
            createdBy: 1,
            participants: 1,
            createdAt: 1,
            updatedAt: 1,
            hasTranscripts: { $gt: [{ $size: '$transcripts' }, 0] },
            hasSummary: { $gt: [{ $size: '$summaries' }, 0] }
          }
        }
      ]).toArray();

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const client = await clientPromise;
    const db = client.db('collabai');

    const meeting = {
      ...data,
      id: `meeting-${new Date().getTime()}`,
      createdBy: session.user.email,
      participants: [session.user.email],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: data.status || 'active'
    };

    const result = await db.collection('meetings').insertOne(meeting);

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
} 