'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import { MeetingProvider, useMeeting } from '@/context/MeetingContext';
import { motion } from 'framer-motion';
import { Video, Clock } from 'lucide-react';

function CalendarContent() {
  const router = useRouter();
  const { scheduledMeetings } = useMeeting();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  useEffect(() => {
    // Filter meetings that are scheduled for the future
    const upcoming = scheduledMeetings.filter(meeting => 
      new Date(meeting.date) > new Date()
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setUpcomingMeetings(upcoming);
  }, [scheduledMeetings]);

  const handleEventClick = (event: any) => {
    if (event.meetingId) {
      router.push(`/meetings/join/${event.meetingId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-6">Meeting Calendar</h1>
          <Calendar onEventClick={handleEventClick} />
        </div>

        {/* Upcoming Meetings Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Upcoming Meetings</h2>
          <div className="bg-white rounded-lg shadow-lg p-4">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b last:border-b-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(meeting.date).toLocaleString()}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(`/meetings/join/${meeting.id}`)}
                        className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Join
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No upcoming meetings scheduled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <MeetingProvider>
      <CalendarContent />
    </MeetingProvider>
  );
} 