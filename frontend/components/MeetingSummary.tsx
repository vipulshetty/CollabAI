'use client';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

interface MeetingSummaryProps {
  socket: Socket | null;
  roomId: string;
  hideWaiting?: boolean;
}

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timestamp: number;
}

export default function MeetingSummary({ socket, roomId, hideWaiting = false }: MeetingSummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleSummary = (data: SummaryData) => {
      console.log('Received summary data:', data);
      setSummaryData(data);
    };

    socket.on('meeting-summary', handleSummary);
    return () => {
      socket.off('meeting-summary', handleSummary);
    };
  }, [socket]);

  if (!summaryData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">Summary</h3>
        <p className="text-gray-700">{summaryData.summary}</p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">Key Points</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summaryData.keyPoints.map((point, index) => (
            <li key={index} className="text-gray-700">{point}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">Action Items</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summaryData.actionItems.map((item, index) => (
            <li key={index} className="text-gray-700">{item}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
} 