import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      console.log('Received save transcripts request:', req.body);

      const { meetingId, transcripts } = req.body;

      // Validate input
      if (!meetingId) {
        console.error('Missing meetingId');
        return res.status(400).json({ 
          error: 'Missing meetingId',
          details: 'A valid meeting ID is required'
        });
      }

      if (!Array.isArray(transcripts) || transcripts.length === 0) {
        console.error('Invalid transcripts', transcripts);
        return res.status(400).json({ 
          error: 'Invalid transcripts',
          details: 'Transcripts must be a non-empty array'
        });
      }

      // Connect to database
      const db = await connectToDatabase();
      const transcriptsCollection = db.collection('transcripts');
      const meetingsCollection = db.collection('meetings');

      // Create transcript document
      const transcriptDocument = {
        meetingId,
        transcripts,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert or update transcript
      const transcriptResult = await transcriptsCollection.updateOne(
        { meetingId },
        { 
          $set: transcriptDocument,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      // Update meeting document with transcripts
      const meetingResult = await meetingsCollection.updateOne(
        { _id: new ObjectId(meetingId) },
        { 
          $set: { 
            transcripts,
            updatedAt: new Date()
          }
        }
      );

      console.log('Transcript save result:', transcriptResult);
      console.log('Meeting update result:', meetingResult);

      res.status(200).json({ 
        message: 'Transcripts saved and meeting updated successfully',
        transcriptResult,
        meetingResult
      });
    } catch (error) {
      console.error('Detailed error saving transcripts:', error);
      res.status(500).json({ 
        error: 'Failed to save transcripts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}