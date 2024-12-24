'use client';

import { useEffect, useState } from 'react';
import { useMeetingContext } from '@/contexts/MeetingContext';
import { Meeting } from '@/types/meeting';
import { MeetingCard } from '@/components/MeetingCard';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Video, Calendar, Activity, History, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardClient() {
  const { meetings, fetchMeetings, loading } = useMeetingContext();
  const router = useRouter();
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (meetings) {
      const now = new Date();
      const recent = meetings
        .filter((meeting) => new Date(meeting.startTime) < now)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 3);
      
      const upcoming = meetings
        .filter((meeting) => new Date(meeting.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3);

      setRecentMeetings(recent);
      setUpcomingMeetings(upcoming);
    }
  }, [meetings]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/meetings/create')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Meeting
            </Button>
            <Button
              onClick={() => router.push('/meetings/join')}
              className="w-full justify-start"
              variant="outline"
            >
              <Video className="mr-2 h-4 w-4" />
              Join Meeting
            </Button>
            <Button
              onClick={() => router.push('/calendar')}
              className="w-full justify-start"
              variant="outline"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </CardContent>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentMeetings.length > 0 ? (
              recentMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent meetings
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming meetings
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
