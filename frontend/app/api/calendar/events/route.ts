import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventData = await request.json();
    const client = await clientPromise;
    const db = client.db('collabai');

    const event = await db.collection('calendar_events').insertOne({
      ...eventData,
      createdBy: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      eventId: event.insertedId 
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ 
      error: 'Failed to create event' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const client = await clientPromise;
    const db = client.db('collabai');

    const events = await db.collection('calendar_events')
      .find({
        $or: [
          { createdBy: session.user.email },
          { participants: session.user.email }
        ],
        startTime: {
          $gte: new Date(start!),
          $lte: new Date(end!)
        }
      })
      .toArray();

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events' 
    }, { status: 500 });
  }
} 