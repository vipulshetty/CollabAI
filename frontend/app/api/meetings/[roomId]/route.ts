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
    const roomId = params.roomId;

    const meeting = await db.collection('meetings').findOne({
      id: roomId,
      $or: [
        { createdBy: session.user.email },
        { participants: session.user.email }
      ]
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const client = await clientPromise;
    const db = client.db('collabai');

    // Try to find the meeting first
    const meeting = await db.collection('meetings').findOne({
      $or: [
        { id: params.roomId },
        { id: `meeting-${params.roomId}` }
      ],
      $or: [
        { createdBy: session.user.email },
        { participants: session.user.email }
      ]
    });

    if (!meeting) {
      return NextResponse.json({ 
        error: 'Meeting not found',
        details: `No meeting found with ID: ${params.roomId}`
      }, { status: 404 });
    }

    const result = await db.collection('meetings').updateOne(
      { id: meeting.id },
      { 
        $set: { 
          status: data.status,
          endedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to update meeting',
        details: 'Meeting found but update failed'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      meeting: meeting.id 
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update meeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 