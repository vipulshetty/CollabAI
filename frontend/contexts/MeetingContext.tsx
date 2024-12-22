'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { Meeting } from '@/types/meeting';

interface CreateMeetingParams {
  title: string;
  status: 'active' | 'scheduled';
  date?: string;
}

interface MeetingContextType {
  createMeeting: (params: CreateMeetingParams) => Promise<string>;
  getUpcomingMeetings: () => Promise<Meeting[]>;
  joinMeeting: (meetingId: string) => Promise<void>;
  endMeeting: (meetingId: string) => Promise<void>;
  currentMeeting: Meeting | null;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);

  const createMeeting = async (params: CreateMeetingParams) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please sign in to create a meeting');
        }
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const data = await response.json();
      if (!data.meeting?.id) {
        throw new Error('Invalid meeting data received');
      }
      return data.meeting.id;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  };

  const getUpcomingMeetings = async () => {
    try {
      const response = await fetch('/api/meetings/upcoming');
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please sign in to view meetings');
        }
        throw new Error(errorData.error || 'Failed to fetch meetings');
      }

      const data = await response.json();
      return data.meetings || [];
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error);
      throw error;
    }
  };

  const joinMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please sign in to join the meeting');
        }
        throw new Error(errorData.error || 'Failed to join meeting');
      }

      const data = await response.json();
      setCurrentMeeting(data.meeting);
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  };

  const endMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/end`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please sign in to end the meeting');
        }
        throw new Error(errorData.error || 'Failed to end meeting');
      }

      setCurrentMeeting(null);
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  };

  return (
    <MeetingContext.Provider
      value={{
        createMeeting,
        getUpcomingMeetings,
        joinMeeting,
        endMeeting,
        currentMeeting,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeetingContext() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeetingContext must be used within a MeetingProvider');
  }
  return context;
}
