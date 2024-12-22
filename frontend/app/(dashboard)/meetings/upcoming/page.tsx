'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { InstantMeeting } from '@/components/InstantMeeting';
import { MeetingCard } from '@/components/MeetingCard';
import { Meeting } from '@/types/meeting';

export default function UpcomingMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/meetings/upcoming');
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming meetings');
        }
        const data = await response.json();
        setMeetings(data);
      } catch (error) {
        console.error('Failed to load upcoming meetings:', error);
        setError(error instanceof Error ? error.message : 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Upcoming Meetings</h1>
          <p className="text-gray-600">
            View and manage your scheduled meetings, or create an instant meeting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <InstantMeeting />
        
        {meetings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No upcoming meetings scheduled
          </div>
        )}
      </div>
    </div>
  );
}
