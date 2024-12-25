'use client';

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Meeting } from '@/types/meeting';
import { useSession } from 'next-auth/react';

interface MeetingContextType {
  meetings: Meeting[];
  loading: boolean;
  fetchMeetings: () => Promise<void>;
  createMeeting: (params: CreateMeetingParams) => Promise<string>;
  joinMeeting: (meetingId: string) => Promise<void>;
  endMeeting: (meetingId: string) => Promise<void>;
  currentMeeting: Meeting | null;
}

interface CreateMeetingParams {
  title: string;
  status: 'active' | 'scheduled';
  date?: string;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const { data: session } = useSession();

  const fetchMeetings = useCallback(async () => {
    if (!session?.user?.email) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/meetings/upcoming');
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Please sign in to view meetings');
        }
        throw new Error(errorData.error || 'Failed to fetch meetings');
      }

      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  const createMeeting = async (params: CreateMeetingParams) => {
    if (!session?.user?.email) {
      throw new Error('Please sign in to create a meeting');
    }

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
      await fetchMeetings();
      return data.meeting.id;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  };

  const joinMeeting = async (meetingId: string) => {
    if (!session?.user?.email) {
      throw new Error('Please sign in to join the meeting');
    }

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
      await fetchMeetings();
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  };

  const endMeeting = async (meetingId: string) => {
    if (!session?.user?.email) {
      throw new Error('Please sign in to end the meeting');
    }

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
      await fetchMeetings();
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  };

  return (
    <MeetingContext.Provider
      value={{
        meetings,
        loading,
        fetchMeetings,
        createMeeting,
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
