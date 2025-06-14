'use client';
import { useEffect, useState, useCallback } from 'react';
import { CalendarService } from '@/services/CalendarService';
import { socketService } from '@/services/socketService';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface CalendarProps {
  onEventClick?: (event: any) => void;
}

export default function Calendar({ onEventClick }: CalendarProps) {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = socketService.getSocket();
  const calendarService = new CalendarService(socket!);

  const loadEvents = useCallback(async () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 2);

    try {
      const response = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    
    if (socket) {
      socket.on('calendar-event-added', handleNewEvent);
      return () => {
        socket.off('calendar-event-added', handleNewEvent);
      };
    }
  }, [socket, loadEvents]);

  const handleNewEvent = (event: any) => {
    setEvents(prev => [...prev, event]);
  };

  const handleEventClick = (event: any) => {
    if (onEventClick) {
      onEventClick(event);
    } else if (event.meetingId) {
      router.push(`/meetings/join/${event.meetingId}`);
    }
  };

  if (loading) return <div>Loading calendar...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="grid grid-cols-7 gap-1">
        {/* Calendar header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {Array.from({ length: 35 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - date.getDay() + i);

          const dayEvents = events.filter(event =>
            format(new Date(event.startTime), 'yyyy-MM-dd') ===
            format(date, 'yyyy-MM-dd')
          );

          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className={`min-h-[100px] border border-gray-200 dark:border-gray-600 p-2 relative rounded-lg transition-all duration-200 ${
                isToday
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className={`text-sm font-medium ${
                isToday
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {format(date, 'd')}
              </span>

              {dayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-1 p-1.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </motion.div>
              ))}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}