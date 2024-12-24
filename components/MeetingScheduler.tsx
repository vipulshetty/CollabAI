'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

interface MeetingSchedulerProps {
  onScheduleMeeting: (meetingId: string, date: Date) => void;
}

export default function MeetingScheduler({ onScheduleMeeting }: MeetingSchedulerProps) {
  const [meetingId, setMeetingId] = useState('');
  const [date, setDate] = useState<Date | null>(null);

  const handleSchedule = () => {
    if (!meetingId || !date) return;
    onScheduleMeeting(meetingId, date);
    setMeetingId('');
    setDate(null);
  };

  return (
    <motion.div 
      className="fixed left-4 bottom-24 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Calendar size={20} />
          Schedule Meeting
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="meetingId" className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
          <input
            id="meetingId"
            type="text"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter meeting ID"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 mb-1">Date and Time</label>
          <div className="relative">
            <input
              id="meetingDate"
              type="datetime-local"
              value={date ? date.toISOString().slice(0, 16) : ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
        <motion.button
          onClick={handleSchedule}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Schedule Meeting
        </motion.button>
      </div>
    </motion.div>
  );
}

