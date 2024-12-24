'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, History, Users, Video, Loader2, ArrowRight, Copy, Share2 } from 'lucide-react';
import RecentMeetings from '@/components/RecentMeetings';
import UpcomingMeetings from '@/components/UpcomingMeetings';
import { Meeting } from '@/types/meeting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

const shakeAnimation = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -10, 10, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
    }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const createInstantMeeting = async () => {
    try {
      setCreatingMeeting(true);
      setError(null);

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Quick Meeting - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          description: 'Instant meeting',
          status: 'scheduled',
          scheduled_date: new Date().toISOString(),
          meeting_url: `/video-call/${Date.now()}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      if (!data.meeting?.id) {
        throw new Error('Invalid meeting data received');
      }

      // For instant meetings, we use the video-call URL format
      const joinUrl = `${window.location.origin}/meetings/${data.meeting.id}/video-call`;
      setMeetingLink(joinUrl);
      setShowMeetingDialog(true);
    } catch (error) {
      console.error('Failed to create instant meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to create meeting');
      setShowMeetingDialog(false);
    } finally {
      setCreatingMeeting(false);
    }
  };

  const copyLink = async () => {
    if (meetingLink) {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinMeeting = () => {
    if (meetingLink) {
      router.push(meetingLink.replace(window.location.origin, ''));
    }
  };

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Meetings Stats */}
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Meetings Stats */}
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
                    Recent Meetings
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
                    Completed
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Participants Stats */}
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
                    Total Participants
                  </CardTitle>
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-green-800 dark:text-green-300">
                    {[...upcomingMeetings, ...recentMeetings].reduce((acc, meeting) => acc + (meeting.participants?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Members
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <Link href="/meetings/create">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Link>
            </Button>
            <Button
              onClick={createInstantMeeting}
              disabled={creatingMeeting}
              variant="outline"
              className="border-2 border-blue-200 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all duration-300"
            >
              {creatingMeeting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Start Instant Meeting
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2].map((section) => (
              <motion.div
                key={section}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg"
          >
            {error}
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            {/* Upcoming Meetings */}
            <motion.section variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  Upcoming Meetings
                </h2>
                <Button
                  asChild
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <UpcomingMeetings meetings={upcomingMeetings} />
              </div>
            </motion.section>

            {/* Recent Meetings */}
            <motion.section variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <History className="h-6 w-6 text-purple-500" />
                  Recent Meetings
                </h2>
                <Button
                  asChild
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <Link href="/dashboard/history" className="flex items-center gap-2">
                    View History
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <RecentMeetings meetings={recentMeetings} />
              </div>
            </motion.section>
          </motion.div>
        )}
      </div>

      {/* Instant Meeting Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Meeting is Ready!</DialogTitle>
            <DialogDescription>
              Share this link with others to join the meeting. Anyone with the link can join.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={meetingLink}
                readOnly
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={copyLink}
                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              >
                {copied ? (
                  <span className="text-green-500 dark:text-green-400 text-sm font-medium">Copied!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={copyLink}
                className="flex-1 gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Invite Link
              </Button>
              <Button
                onClick={joinMeeting}
                className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                <Video className="h-4 w-4" />
                Join Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {error}
        </div>
      )}
    </div>
  );
}