import { Socket } from 'socket.io-client';

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timestamp: number;
}

export class MeetingSummaryService {
  constructor(private socket: Socket, private roomId: string) {}

  async generateSummary(transcripts: string[]) {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcripts, roomId: this.roomId })
      });
      
      if (!response.ok) throw new Error('Failed to generate summary');

      const summaryData: SummaryData = await response.json();
      
      this.socket.emit('meeting-summary', {
        ...summaryData,
        roomId: this.roomId
      });
      
      return summaryData;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }
} 