import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: Request,
  { params }: { params: { mongoId: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, transcripts } = await request.json();
    
    // Validate status
    const validStatuses = ['scheduled', 'active', 'ended', 'completed'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`Invalid status value: ${status}`);
    }

    // Validate transcripts is an array
    const validatedTranscripts = Array.isArray(transcripts) ? transcripts : [];

    // Find meeting using the normalized ID
    const meetingId = params.mongoId.replace('meeting-', '');
    const normalizedId = `meeting-${meetingId}`;

    const client = await clientPromise;
    const db = client.db('collabai');

    const result = await db.collection('meetings').findOneAndUpdate(
      { 
        $or: [
          { _id: new ObjectId(meetingId) },
          { id: normalizedId },
          { id: meetingId }
        ]
      },
      { 
        $set: {
          status: status || 'completed',
          transcripts: validatedTranscripts,
          updatedAt: new Date()
        }
      },
      { 
        returnDocument: 'after',
        upsert: false
      }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Ensure the updated meeting is fetched correctly
    const updatedMeeting = await db.collection('meetings').findOne({ _id: result.value._id });

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting
    });

  } catch (error) {
    console.error('API Error updating meeting:', error);
    return NextResponse.json({ 
      error: 'Failed to update meeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
