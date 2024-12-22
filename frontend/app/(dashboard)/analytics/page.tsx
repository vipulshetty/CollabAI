'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  BarChart2, 
  MessageSquare, 
  CheckSquare,
  Users
} from 'lucide-react';
import { MeetingAnalytics } from '@/components/analytics/MeetingAnalytics';
import { ParticipantStats } from '@/components/analytics/ParticipantStats';
import { ActionItemsChart } from '@/components/analytics/ActionItemsChart';
import { SentimentTrend } from '@/components/analytics/SentimentTrend';

interface AnalyticsData {
  meetingId: string;
  totalDuration: number;
  participantStats: {
    name: string;
    speakingTime: number;
    messageCount: number;
    actionItems: number;
    sentimentScore: number;
  }[];
  sentimentTrend: {
    timestamp: string;
    score: number;
  }[];
  actionItems: {
    participant: string;
    count: number;
    completed: number;
  }[];
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error instanceof Error ? error.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-gray-500 text-center py-8">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meeting Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold">Total Duration</h3>
          </div>
          <p className="text-2xl font-bold">
            {Math.round(analyticsData.totalDuration / 60)} mins
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Participants</h3>
          </div>
          <p className="text-2xl font-bold">
            {analyticsData.participantStats.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Messages</h3>
          </div>
          <p className="text-2xl font-bold">
            {analyticsData.participantStats.reduce((acc, curr) => acc + curr.messageCount, 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Action Items</h3>
          </div>
          <p className="text-2xl font-bold">
            {analyticsData.actionItems.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Speaking Time Distribution</h3>
          <ParticipantStats data={analyticsData.participantStats} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
          <SentimentTrend data={analyticsData.sentimentTrend} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-lg shadow-md col-span-full"
        >
          <h3 className="text-lg font-semibold mb-4">Action Items by Participant</h3>
          <ActionItemsChart data={analyticsData.actionItems} />
        </motion.div>
      </div>
    </div>
  );
}
