'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import RecentMeetings from '@/components/RecentMeetings';
import UpcomingMeetings from '@/components/UpcomingMeetings';
import { Meeting } from '@/types/meeting';

export default function DashboardPage() {
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        setError(null);

        const [recentResponse, upcomingResponse] = await Promise.all([
          fetch('/api/meetings/recent'),
          fetch('/api/meetings/upcoming')
        ]);

        if (!recentResponse.ok) {
          const recentError = await recentResponse.text();
          console.error('Recent meetings response error:', recentResponse.status, recentError);
          throw new Error(`Failed to fetch recent meetings: ${recentResponse.status}`);
        }

        if (!upcomingResponse.ok) {
          const upcomingError = await upcomingResponse.text();
          console.error('Upcoming meetings response error:', upcomingResponse.status, upcomingError);
          throw new Error(`Failed to fetch upcoming meetings: ${upcomingResponse.status}`);
        }

        const [recentData, upcomingData] = await Promise.all([
          recentResponse.json(),
          upcomingResponse.json()
        ]);

        if (!Array.isArray(recentData)) {
          console.error('Invalid recent meetings data:', recentData);
          throw new Error('Recent meetings data is not in the expected format');
        }

        if (!Array.isArray(upcomingData)) {
          console.error('Invalid upcoming meetings data:', upcomingData);
          throw new Error('Upcoming meetings data is not in the expected format');
        }

        setRecentMeetings(recentData);
        setUpcomingMeetings(upcomingData);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/meetings/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          New Meeting
        </Link>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
            <div className="max-w-3xl">
              <UpcomingMeetings meetings={upcomingMeetings} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">Recent Meetings</h2>
            <div className="max-w-3xl">
              <RecentMeetings meetings={recentMeetings} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}