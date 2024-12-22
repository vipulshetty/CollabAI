'use client';

import { useEffect, useState } from 'react';
import { useMeetingContext } from '@/contexts/MeetingContext';
import { Meeting } from '@/types/meeting';
import { MeetingCard } from '@/components/MeetingCard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Video } from 'lucide-react';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { getUpcomingMeetings } = useMeetingContext();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getUpcomingMeetings();
        setMeetings(data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [getUpcomingMeetings]);

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/room/${meetingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const recentMeetings = meetings.filter(m => m.status === 'ended');
  const activeMeetings = meetings.filter(m => m.status === 'active');

  return (
    <div className="space-y-8 p-6 w-full">
      {/* Quick Actions */}
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/meetings/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
          <Button
            onClick={() => router.push('/meetings/new')}
            variant="secondary"
          >
            <Video className="mr-2 h-4 w-4" />
            Start Instant Meeting
          </Button>
        </div>
      </div>

      {/* Active Meetings */}
      {activeMeetings.length > 0 && (
        <section className="w-full">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Active Meetings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            {activeMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={handleJoinMeeting}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Meetings */}
      <section className="w-full">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Upcoming Meetings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={handleJoinMeeting}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No upcoming meetings</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Meetings */}
      <section className="w-full">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Recent Meetings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {recentMeetings.length > 0 ? (
            recentMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No recent meetings</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
