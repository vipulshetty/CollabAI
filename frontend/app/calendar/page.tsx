'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { MeetingProvider, useMeetingContext } from '@/contexts/MeetingContext';
import { motion } from 'framer-motion';
import { Video, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Meeting } from '@/types/meeting';
import Navbar from '@/components/Navbar';

function CalendarContent() {
  const router = useRouter();
  const { meetings, fetchMeetings } = useMeetingContext();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (meetings) {
      // Set all meetings for calendar display
      setAllMeetings(meetings);

      // Filter meetings that are scheduled for the future
      const upcoming = meetings.filter(meeting =>
        new Date(meeting.scheduled_date) > new Date() && meeting.status === 'scheduled'
      ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      setUpcomingMeetings(upcoming);
    }
  }, [meetings]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };



  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Meeting Calendar</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard/meetings/schedule')}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </motion.button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/70"
                >
                  Today
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="font-semibold p-2 text-gray-700 dark:text-gray-300">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const today = new Date();
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startOfCalendar = new Date(startOfMonth);
                startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
                const cellDate = new Date(startOfCalendar);
                cellDate.setDate(cellDate.getDate() + i);

                const isCurrentMonth = cellDate.getMonth() === currentDate.getMonth();
                const isToday = cellDate.toDateString() === today.toDateString();

                // Check if there are meetings on this date (show ALL meetings, not just upcoming)
                const dayMeetings = allMeetings.filter(meeting => {
                  const meetingDate = new Date(meeting.scheduled_date);
                  return meetingDate.toDateString() === cellDate.toDateString();
                });

                return (
                  <div
                    key={i}
                    className={`min-h-[80px] border p-2 relative ${
                      isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}`}
                  >
                    <span className={`text-sm ${
                      isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                    } ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                      {cellDate.getDate()}
                    </span>
                    {dayMeetings.map((meeting) => {
                      const meetingColor = meeting.status === 'completed'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : meeting.status === 'scheduled'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';

                      return (
                        <div
                          key={meeting.id}
                          className={`mt-1 p-1 text-xs rounded cursor-pointer hover:opacity-80 ${meetingColor}`}
                          onClick={() => {
                            if (meeting.status === 'completed') {
                              router.push(`/dashboard`); // Go to dashboard to see summary
                            } else {
                              router.push(`/meetings/${meeting.id}/video-call`);
                            }
                          }}
                          title={`${meeting.title} - ${meeting.status}`}
                        >
                          {meeting.title.length > 12 ? meeting.title.substring(0, 12) + '...' : meeting.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
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
                          {new Date(meeting.scheduled_date).toLocaleString()}
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
    </>
  );
}

export default function CalendarPage() {
  return (
    <MeetingProvider>
      <CalendarContent />
    </MeetingProvider>
  );
}