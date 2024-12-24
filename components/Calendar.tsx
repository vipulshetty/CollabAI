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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <div className="grid grid-cols-7 gap-2">
        {/* Calendar header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-2">
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

          return (
            <div 
              key={i}
              className="min-h-[100px] border p-2 relative"
            >
              <span className="text-sm text-gray-600">
                {format(date, 'd')}
              </span>
              
              {dayEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  className="mt-1 p-1 text-xs bg-blue-100 rounded cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}