import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { meetingId, transcripts } = await request.json();
    
    const client = await clientPromise;
    const db = client.db('collabai');
    
    const normalizedId = meetingId.replace('meeting-', '');
    const displayId = `meeting-${normalizedId}`;

    // Store transcripts with proper formatting
    const transcriptDoc = await db.collection('transcripts').insertOne({
      meetingId: displayId,
      transcripts: transcripts.map(t => ({
        text: t.text,
        timestamp: t.timestamp,
        speaker: t.speaker
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update meeting
    await db.collection('meetings').updateOne(
      { id: displayId },
      { 
        $set: {
          hasTranscripts: true,
          lastTranscriptUpdate: new Date(),
          transcriptCount: transcripts.length
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      transcriptId: transcriptDoc.insertedId,
      transcriptCount: transcripts.length
    });
  } catch (error) {
    console.error('Error saving transcripts:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save transcripts' 
    }, { status: 500 });
  }
} 