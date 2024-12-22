import { Server, Socket } from 'socket.io';
import { Transcript } from '../../models/Transcript';
import { getServerSession } from 'next-auth';
import { authConfig } from '../../lib/auth/auth-config';
import dbConnect from '../../lib/mongodb';

interface TranscriptData {
  meetingId: string;
  transcripts: string[];
}

export const setupTranscriptHandlers = (io: Server, socket: Socket) => {
  const MAX_TRANSCRIPT_LENGTH = 10000; // characters
  const MAX_TOTAL_TRANSCRIPTS = 5000; // Total transcript size limit

  socket.on('save-meeting-transcripts', async (
    data: TranscriptData, 
    callback: (response: { success: boolean; error?: string }) => void
  ) => {
    try {
      console.log('Received save-meeting-transcripts event:', {
        meetingId: data.meetingId,
        transcriptsCount: data.transcripts?.length || 0
      });

      // Validate input
      if (!data.meetingId || !data.transcripts || data.transcripts.length === 0) {
        console.log('Invalid input data:', { data });
        return callback({ 
          success: false, 
          error: 'Invalid transcripts or meeting ID' 
        });
      }

      // Connect to database
      try {
        await dbConnect();
        console.log('Successfully connected to MongoDB');
      } catch (dbError) {
        console.error('Failed to connect to MongoDB:', dbError);
        return callback({
          success: false,
          error: 'Database connection failed'
        });
      }

      // Get user session (if possible)
      const session = await getServerSession(authConfig);
      const userEmail = session?.user?.email || 'system@collabai.com';
      console.log('User session:', { userEmail });

      // Filter and validate transcripts
      const validTranscripts = data.transcripts
        .filter(transcript => 
          transcript && 
          transcript.trim().length > 0 && 
          transcript.length <= MAX_TRANSCRIPT_LENGTH
        )
        .slice(0, MAX_TOTAL_TRANSCRIPTS)
        .map(text => ({
          text,
          timestamp: new Date(),
          speaker: 'Unknown'
        }));

      console.log('Processed transcripts:', {
        originalCount: data.transcripts.length,
        validCount: validTranscripts.length
      });

      if (validTranscripts.length === 0) {
        console.log('No valid transcripts to save');
        return callback({
          success: false,
          error: 'No valid transcripts to save'
        });
      }

      // Create new transcript document
      const transcriptDoc = new Transcript({
        meetingId: data.meetingId,
        transcripts: validTranscripts,
        createdBy: userEmail,
        metadata: {
          totalTranscripts: validTranscripts.length,
          originalTranscriptsCount: data.transcripts.length
        }
      });

      console.log('Attempting to save transcript document');
      
      // Save to database with timeout
      const savePromise = transcriptDoc.save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save operation timed out')), 10000)
      );

      const savedDoc = await Promise.race([savePromise, timeoutPromise]);
      console.log('Successfully saved transcript document:', savedDoc._id);

      // Emit success callback
      callback({ 
        success: true,
        transcriptId: savedDoc._id.toString()
      });

      // Optional: Broadcast transcript save event to room
      socket.to(data.meetingId).emit('transcripts-saved', {
        transcriptId: savedDoc._id.toString(),
        totalTranscripts: validTranscripts.length
      });

    } catch (error) {
      console.error('Transcript Saving Error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Additional handler for retrieving transcripts
  socket.on('get-meeting-transcripts', async (
    data: { meetingId: string }, 
    callback: (response: { success: boolean; transcripts?: any; error?: string }) => void
  ) => {
    try {
      const transcripts = await Transcript.find({ 
        meetingId: data.meetingId 
      }).sort({ createdAt: -1 });

      callback({
        success: true,
        transcripts: transcripts.map(t => ({
          id: t._id,
          transcripts: t.transcripts,
          createdAt: t.createdAt
        }))
      });
    } catch (error) {
      callback({
        success: false,
        error: 'Failed to retrieve transcripts'
      });
    }
  });
};