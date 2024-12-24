'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Copy, Share2 } from 'lucide-react';
import { useMeetingContext } from '@/contexts/MeetingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function InstantMeeting() {
  const router = useRouter();
  const { createMeeting } = useMeetingContext();
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const createInstantMeeting = async () => {
    try {
      setLoading(true);
      const meetingId = await createMeeting({
        title: `Instant Meeting - ${new Date().toLocaleString()}`,
        status: 'active',
      });
      const link = `${window.location.origin}/meetings/join/${meetingId}`;
      setMeetingLink(link);
    } catch (error) {
      console.error('Failed to create instant meeting:', error);
    } finally {
      setLoading(false);
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
      const meetingId = meetingLink.split('/').pop();
      router.push(`/meetings/join/${meetingId}`);
    }
  };

  return (
    <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Instant Meeting
        </h2>
      </div>

      {!meetingLink ? (
        <motion.div whileHover={{ scale: 1.01 }}>
          <Button
            onClick={createInstantMeeting}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Video className="w-5 h-5 mr-2" />
                Create Instant Meeting
              </>
            )}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={meetingLink}
              readOnly
              className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            >
              {copied ? (
                <span className="text-green-500 dark:text-green-400 text-sm font-medium">Copied!</span>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={copyLink}
              variant="outline"
              className="flex items-center justify-center gap-2 border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
            <Button
              onClick={joinMeeting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <Share2 className="w-4 h-4" />
              Join Now
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
