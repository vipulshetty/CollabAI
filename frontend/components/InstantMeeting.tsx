'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Copy, Share2 } from 'lucide-react';
import { useMeetingContext } from '@/contexts/MeetingContext';

export default function InstantMeeting() {
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
        instant: true,
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-500" />
          Instant Meeting
        </h2>
      </div>

      {!meetingLink ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createInstantMeeting}
          disabled={loading}
          className={`w-full py-3 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2
            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Video className="w-5 h-5" />
              Create Instant Meeting
            </>
          )}
        </motion.button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={meetingLink}
              readOnly
              className="flex-1 bg-transparent outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className="p-2 text-gray-600 hover:text-blue-500"
            >
              {copied ? (
                <span className="text-green-500 text-sm">Copied!</span>
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={joinMeeting}
              className="py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Video className="w-5 h-5" />
              Join Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyLink}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200"
            >
              <Share2 className="w-5 h-5" />
              Share Link
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
