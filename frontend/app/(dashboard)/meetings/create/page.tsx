'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Calendar } from 'lucide-react';
import { useMeeting } from '@/context/MeetingContext';

export default function CreateMeetingPage() {
  const router = useRouter();
  const { startMeeting, scheduleMeeting } = useMeeting();
  const [title, setTitle] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartMeeting = async () => {
    try {
      setIsLoading(true);
      if (!title) {
        alert('Please enter a meeting title');
        return;
      }
      console.log('Starting meeting with title:', title);
      const meetingId = await startMeeting(title);
      console.log('Meeting created with ID:', meetingId);
      router.push(`/meetings/join/${meetingId}`);
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert('Failed to start meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!title || !scheduledTime) {
      alert('Please fill in all fields');
      return;
    }
    scheduleMeeting(title, scheduledTime);
    await router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Meeting</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Team Sync"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule For Later
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartMeeting}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-4 border-b-4 border-blue-500"></div>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-2" />
                  Start Now
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleScheduleMeeting}
              className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center"
              disabled={!title || !scheduledTime}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 