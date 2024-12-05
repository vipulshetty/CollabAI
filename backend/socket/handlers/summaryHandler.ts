export function handleMeetingSummary(io: Server, socket: Socket) {
  // Store transcripts
  socket.on('transcription-end', async (data: { roomId: string, transcripts: string[] }, callback: (response: { success: boolean }) => void) => {
    try {
      console.log('Received transcription-end event:', {
        roomId: data.roomId,
        transcriptCount: data.transcripts.length,
        socketId: socket.id,
        user: socket.user?.email
      });

      const client = await clientPromise;
      const db = client.db('collabai');
      
      // Normalize meeting ID format
      const meetingId = data.roomId.replace('meeting-', '');
      const displayId = `meeting-${meetingId}`;
      
      console.log('Looking for meeting with ID:', displayId);
      
      const meeting = await db.collection('meetings').findOne({
        id: displayId
      });

      if (!meeting) {
        console.error('Meeting not found:', {
          searchId: displayId,
          originalId: data.roomId
        });
        return callback({ success: false });
      }

      console.log('Found meeting:', {
        id: meeting.id,
        createdBy: meeting.createdBy
      });

      // Store transcripts
      const transcriptDoc = await db.collection('transcripts').insertOne({
        meetingId: displayId,
        transcripts: data.transcripts,
        timestamp: new Date(),
        createdBy: socket.user?.email || meeting.createdBy
      });

      console.log('Stored transcripts:', {
        id: transcriptDoc.insertedId,
        count: data.transcripts.length
      });

      // Update meeting
      await db.collection('meetings').updateOne(
        { id: displayId },
        { 
          $set: {
            hasTranscripts: true,
            lastTranscriptUpdate: new Date(),
            transcriptCount: data.transcripts.length
          }
        }
      );
      
      console.log('Successfully updated meeting with transcript info');
      callback({ success: true });
    } catch (error) {
      console.error('Error storing transcripts:', error);
      callback({ success: false });
    }
  });

  // Generate summary on demand
  socket.on('generate-summary', async (data: { roomId: string }) => {
    try {
      const client = await clientPromise;
      const db = client.db('collabai');
      
      const transcriptDoc = await db.collection('transcripts')
        .findOne({ roomId: data.roomId, summarized: false });
      
      if (transcriptDoc) {
        const summaryService = new MeetingSummaryService(socket, data.roomId);
        const summary = await summaryService.generateSummary(transcriptDoc.transcripts);
        
        if (summary) {
          await db.collection('summaries').insertOne({
            roomId: data.roomId,
            summary: summary.summary,
            keyPoints: summary.keyPoints,
            actionItems: summary.actionItems,
            timestamp: new Date(),
            createdBy: socket.user?.email
          });

          await db.collection('transcripts')
            .updateOne(
              { _id: transcriptDoc._id },
              { $set: { summarized: true } }
            );

          socket.emit('meeting-summary', {
            summary: summary.summary,
            keyPoints: summary.keyPoints,
            actionItems: summary.actionItems,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      socket.emit('summary-error', { message: 'Failed to generate summary' });
    }
  });
} 