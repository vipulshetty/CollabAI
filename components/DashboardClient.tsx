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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your meetings, join active sessions, and stay connected with your team
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => router.push('/protected/dashboard/meetings/instant')}
              className="relative w-full justify-start group overflow-hidden bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-transparent dark:hover:border-transparent transition-all duration-500"
            >
              {/* RGB Border Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 animate-gradient-xy"></div>
                <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-lg"></div>
              </div>
              
              {/* Glowing Dots */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -left-2 top-1/2 w-4 h-4 bg-blue-500 rounded-full blur-md transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="absolute left-1/4 top-1/2 w-4 h-4 bg-purple-500 rounded-full blur-md transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 delay-75"></div>
                <div className="absolute left-2/4 top-1/2 w-4 h-4 bg-pink-500 rounded-full blur-md transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 delay-150"></div>
              </div>
              
              {/* Content */}
              <div className="relative flex items-center">
                <div className="relative">
                  <Plus className="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
                </div>
                <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-medium">
                  Start Instant Meeting
                </span>
              </div>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute inset-0 transform translate-x-full group-hover:translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
              </div>
            </Button>
            <Button
              onClick={() => router.push('/dashboard/meetings/schedule')}
              className="relative w-full justify-start group overflow-hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] hover:bg-[position:100%_100%] transition-[background-position] duration-500"></div>
              <Calendar className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 duration-300" />
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Recent and Upcoming Meetings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Meetings */}
          <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Meetings</CardTitle>
                <History className="h-5 w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {recentMeetings.length > 0 ? (
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
          <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Meetings</CardTitle>
                <Calendar className="h-5 w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {upcomingMeetings.length > 0 ? (
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
      </div>
    </div>
  );
}
