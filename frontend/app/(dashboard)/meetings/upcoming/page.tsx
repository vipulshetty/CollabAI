'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, Video, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { InstantMeeting } from '@/components/InstantMeeting'; 
import { MeetingCard } from '@/components/MeetingCard';
import { Meeting } from '@/types/meeting';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

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

export default function UpcomingMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/meetings/upcoming');
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming meetings');
        }
        const data = await response.json();
        setMeetings(data);
      } catch (error) {
        console.error('Failed to load upcoming meetings:', error);
        setError(error instanceof Error ? error.message : 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => 
      isSameDay(new Date(meeting.scheduled_date), date)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Upcoming Meetings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and manage your scheduled meetings, or create an instant meeting
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/meetings/create'}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="p-4 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-gray-500 dark:text-gray-400 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIdx) => {
                  const dayMeetings = getMeetingsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <motion.button
                      key={day.toString()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-2 rounded-lg transition-all duration-200
                        ${!isCurrentMonth && 'text-gray-400 dark:text-gray-600'}
                        ${isSelected && 'bg-blue-500 text-white'}
                        ${isToday && !isSelected && 'bg-blue-100 dark:bg-blue-900/30'}
                        ${dayMeetings.length > 0 && !isSelected && 'font-bold text-blue-600 dark:text-blue-400'}
                        hover:bg-blue-50 dark:hover:bg-blue-900/20
                      `}
                    >
                      {format(day, 'd')}
                      {dayMeetings.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Meetings List Section */}
          <motion.div variants={item} className="lg:col-span-2 space-y-6">
            <InstantMeeting />
            
            {meetings.length > 0 ? (
              <motion.div
                variants={container}
                className="space-y-4"
              >
                {meetings
                  .filter(meeting => !selectedDate || isSameDay(new Date(meeting.scheduled_date), selectedDate))
                  .map((meeting) => (
                    <motion.div key={meeting.id} variants={item}>
                      <MeetingCard meeting={meeting} />
                    </motion.div>
                  ))}
              </motion.div>
            ) : (
              <motion.div
                variants={item}
                className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No upcoming meetings
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Schedule a meeting to get started
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
