'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMeeting } from '@/contexts/MeetingContext';
import { socketService } from '@/services/socketService';

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  timestamp: number;
}

interface Props {
  roomId: string;
  realtimeSummaries?: SummaryData[];
}

export default function PastMeetingSummaries({ roomId, realtimeSummaries = [] }: Props) {
  const [apiSummaries, setApiSummaries] = useState<SummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const socket = socketService.getSocket();

  const handleGenerateSummary = () => {
    if (socket) {
      setIsGenerating(true);
      socket.emit('generate-summary', { roomId });

      // Listen for the summary response
      socket.once('meeting-summary', (data: SummaryData) => {
        setApiSummaries(prev => [...prev, data]);
        setIsGenerating(false);
      });

      // Handle potential errors
      socket.once('summary-error', (error) => {
        setError(error.message);
        setIsGenerating(false);
      });
    }
  };

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/meetings/${roomId}/summaries`);
        if (!response.ok) {
          throw new Error('Failed to fetch summaries');
        }
        const data = await response.json();
        setApiSummaries(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchSummaries();
    }
  }, [roomId]);

  const allSummaries = [...apiSummaries, ...realtimeSummaries];

  return (
    <div className="space-y-6">
      {allSummaries.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-600">No summaries available for this meeting.</p>
          <button 
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </div>
      )}

      {allSummaries.map((summary, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Summary</h3>
              <p className="text-gray-700">{summary.summary}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Key Points</h3>
              <ul className="list-disc pl-5 space-y-1">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Action Items</h3>
              <ul className="list-disc pl-5 space-y-1">
                {summary.actionItems.map((item, idx) => (
                  <li key={idx} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}