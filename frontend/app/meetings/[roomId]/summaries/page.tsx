'use client';
import PastMeetingSummaries from '@/components/PastMeetingSummaries';
import { MeetingProvider } from '@/context/MeetingContext';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timestamp: number;
}

export default function MeetingSummariesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      const handleSummary = (data: SummaryData) => {
        console.log('Received real-time summary:', data);
        setSummaryData(prev => [...prev, data]);
      };

      socket.on('meeting-summary', handleSummary);
      return () => {
        socket.off('meeting-summary', handleSummary);
      };
    }
  }, []);

  return (
    <MeetingProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Past Meeting Summaries</h1>
        <PastMeetingSummaries 
          roomId={roomId} 
          realtimeSummaries={summaryData}
        />
      </div>
    </MeetingProvider>
  );
} 