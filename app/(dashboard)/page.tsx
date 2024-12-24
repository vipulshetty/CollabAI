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

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

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
        >
          <Loader2 className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const recentMeetings = meetings.filter(m => m.status === 'ended');
  const activeMeetings = meetings.filter(m => m.status === 'active');

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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Meetings Card */}
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden"
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800 shadow-lg shadow-green-100/20 dark:shadow-green-900/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
                    Active Meetings
                  </CardTitle>
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-green-800 dark:text-green-300">
                    {activeMeetings.length}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Live Now
                  </div>
                </div>
                {activeMeetings.length > 0 && (
                  <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
                    <Users className="h-4 w-4 mr-1" />
                    {activeMeetings.reduce((acc, meeting) => acc + (meeting.participants?.length || 0), 0)} participants online
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Meetings Card */}
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800 shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Upcoming Meetings
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                    {upcomingMeetings.length}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Scheduled
                  </div>
                </div>
                {upcomingMeetings.length > 0 && (
                  <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                    Next in {formatTimeToNext(upcomingMeetings[0].start_time)}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed Meetings Card */}
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden"
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-100/20 dark:shadow-purple-900/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Completed Meetings
                  </CardTitle>
                  <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-300">
                    {recentMeetings.length}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    With Transcripts
                  </div>
                </div>
                {recentMeetings.length > 0 && (
                  <div className="mt-4 text-sm text-purple-600 dark:text-purple-400">
                    {recentMeetings.length} meetings archived
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => router.push('/meetings/create')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button
              onClick={() => router.push('/meetings/new')}
              variant="outline"
              className="border-2 border-blue-200 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all duration-300"
            >
              <Video className="mr-2 h-4 w-4" />
              Start Instant Meeting
            </Button>
          </div>
        </div>

        {/* Active Meetings */}
        {activeMeetings.length > 0 && (
          <motion.section
            initial="hidden"
            animate="show"
            variants={container}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Activity className="h-5 w-5 text-green-500" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Live Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMeetings.map((meeting) => (
                <motion.div 
                  key={meeting.id} 
                  variants={item}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="transform transition-all duration-300"
                >
                  <MeetingCard
                    meeting={meeting}
                    onJoin={handleJoinMeeting}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Upcoming Meetings */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={container}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Coming Up</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <motion.div 
                  key={meeting.id} 
                  variants={item}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="transform transition-all duration-300"
                >
                  <MeetingCard
                    meeting={meeting}
                    onJoin={handleJoinMeeting}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div variants={item} className="col-span-full">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-blue-400 mb-4 animate-bounce" />
                    <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-2">No upcoming meetings</h3>
                    <p className="text-blue-600 dark:text-blue-400 mb-6">Schedule a meeting to get started</p>
                    <Button
                      onClick={() => router.push('/meetings/create')}
                      variant="outline"
                      className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Recent Meetings */}
        {recentMeetings.length > 0 && (
          <motion.section
            initial="hidden"
            animate="show"
            variants={container}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <History className="h-5 w-5 text-purple-500" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Recent Meetings</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMeetings.map((meeting) => (
                <motion.div 
                  key={meeting.id} 
                  variants={item}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="transform transition-all duration-300"
                >
                  <MeetingCard
                    meeting={meeting}
                    onJoin={handleJoinMeeting}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

function formatTimeToNext(startTime: string): string {
  const now = new Date();
  const meetingTime = new Date(startTime);
  const diff = meetingTime.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
