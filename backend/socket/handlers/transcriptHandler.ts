import { Server, Socket } from 'socket.io';
import { Transcript } from '../../models/Transcript';
import { getServerSession } from 'next-auth';
import { authConfig } from '../../lib/auth/auth-config';

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
      // Validate input
      if (!data.meetingId || !data.transcripts || data.transcripts.length === 0) {
        return callback({ 
          success: false, 
          error: 'Invalid transcripts or meeting ID' 
        });
      }

      // Get user session (if possible)
      const session = await getServerSession(authConfig);
      const userEmail = session?.user?.email || 'system@collabai.com';

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
          speaker: 'Unknown' // You might want to enhance this
        }));

      if (validTranscripts.length === 0) {
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

      // Save to database
      await transcriptDoc.save();

      // Emit success callback
      callback({ 
        success: true,
        transcriptId: transcriptDoc._id.toString()
      });

      // Optional: Broadcast transcript save event to room
      socket.to(data.meetingId).emit('transcripts-saved', {
        transcriptId: transcriptDoc._id.toString(),
        totalTranscripts: validTranscripts.length
      });

    } catch (error) {
      console.error('Transcript Saving Error:', error);
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