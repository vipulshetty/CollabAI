'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCall from '@/components/VideoCall';
import { MeetingProvider } from '@/contexts/MeetingContext';
import { Camera, Waves } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  meeting_url: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const meetingId = params?.meetingId;
        if (!meetingId || typeof meetingId !== 'string') {
          throw new Error('Invalid meeting ID');
        }

        const response = await fetch(`/api/meetings/${meetingId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch meeting');
        }

        const { meeting } = await response.json();
        if (!meeting) {
          throw new Error('Meeting not found');
        }

        setMeeting(meeting);
        // Add a small delay before removing the joining screen
        setTimeout(() => setIsJoining(false), 1500);
      } catch (error: any) {
        console.error('Error fetching meeting:', error);
        setError(error.message);
        setIsJoining(false);
      }
    };

    fetchMeeting();
  }, [params?.meetingId, router]);

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white"
      >
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <MeetingProvider>
      <AnimatePresence mode="wait">
        {isJoining ? (
          <motion.div
            key="joining"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white space-y-6"
          >
            <div className="relative">
              <motion.div
                className="absolute -inset-4"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full rounded-full bg-blue-500/20 blur-md" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <Camera className="w-16 h-16 text-blue-500" />
              </motion.div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xl font-medium">Joining meeting...</p>
              <motion.div 
                className="flex items-center justify-center gap-1"
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Waves className="w-4 h-4 text-blue-500" />
                <p className="text-sm text-blue-500">Connecting to secure server</p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="video-call"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-4 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-gray-900 to-black"
          >
            {meeting && <VideoCall peerId={meeting.id} />}
          </motion.div>
        )}
      </AnimatePresence>
    </MeetingProvider>
  );
}
