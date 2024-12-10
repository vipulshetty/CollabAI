import { Socket } from 'socket.io-client';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  meetingId?: string;
  description?: string;
}

export class CalendarService {
  constructor(private socket: Socket) {}

  async addToCalendar(event: Omit<CalendarEvent, 'id'>) {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      if (!response.ok) throw new Error('Failed to add event');
      
      const savedEvent = await response.json();
      this.socket.emit('calendar-event-added', savedEvent);
      
      return savedEvent;
    } catch (error) {
      console.error('Error adding calendar event:', error);
      return null;
    }
  }

  async getEvents(startDate: Date, endDate: Date) {
    try {
      const response = await fetch(`/api/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }
} 