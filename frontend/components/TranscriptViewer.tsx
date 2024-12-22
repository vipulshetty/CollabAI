
'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { socketService } from '../services/socketService';
import { supabase } from '@/lib/supabaseClient';

interface Meeting {
  _id?: string;
  id: string;
  title: string;
  date: string;
  duration?: string;
  participants: string[];
  status: 'scheduled' | 'active' | 'ended';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  transcripts?: string[];
}

interface MeetingContextType {
  meetings: Meeting[];
  scheduledMeetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  startMeeting: (title: string) => Promise<string>;
  scheduleMeeting: (title: string, date: string) => Promise<void>;
  joinMeeting: (meetingId: string) => Promise<void>;
  endMeeting: (meetingId: string, shouldNavigate?: boolean, transcripts?: string[]) => Promise<void>;
  fetchMeetings: () => Promise<void>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [scheduledMeetings, setScheduledMeetings] = useState<Meeting[]>([]);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const socketRef = useRef(socketService);

  useEffect(() => {
    const socket = socketRef.current.getSocket();
    
    // Only initialize socket if we don't have an active connection
    if (!socket?.connected) {
      socketRef.current.getSocket();
    }
    
    return () => {
      // Only disconnect if we're not in the middle of a meeting
      if (!currentMeeting) {
        socketRef.current.disconnect();
      }
    };
  }, [currentMeeting]);

  useEffect(() => {
    fetchMeetings();
  }, [session]);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/meetings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch meetings');
      }

      const data = await response.json();
      setMeetings(data.meetings || []);
      setScheduledMeetings(data.scheduledMeetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError(error.message || 'Failed to load meetings');
      // Set empty arrays to prevent undefined errors
      setMeetings([]);
      setScheduledMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addParticipant = (participantId: string) => {
    setParticipants(prev => {
      if (!prev.includes(participantId)) {
        return [...prev, participantId];
      }
      return prev;
    });
  };

  const startMeeting = async (title: string) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status: 'active',
          date: new Date().toISOString()
        })
      });
      const data = await response.json();
      console.log('Meeting created:', data);
      if (!data.meeting) {
        throw new Error('Failed to create meeting');
      }
      setCurrentMeeting(data.meeting);
      return data.meeting.id || data.meeting._id;
    } catch (error) {
      console.error('Error starting meeting:', error);
      throw error;
    }
  };

  const joinMeeting = async (meetingId: string) => {
    try {
      console.log('Joining meeting:', meetingId);
      
      // First try to find in local state
      const meeting = meetings.find(m => m.id === meetingId) || 
                     scheduledMeetings.find(m => m.id === meetingId);
      
      if (meeting) {
        setCurrentMeeting(meeting);
      } else {
        // If not found locally, fetch from API
        const response = await fetch(`/api/meetings/${meetingId}`);
        if (!response.ok) {
          throw new Error('Meeting not found');
        }
        const data = await response.json();
        const newMeeting = data.meeting;
        setMeetings(prev => [...prev, newMeeting]);
        setCurrentMeeting(newMeeting);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      throw error;
    }
  };

  const endMeeting = async (meetingId: string, redirect: boolean = true, transcripts: string[] = []) => {
    try {
      console.log('Saving transcripts:', transcripts);
      
      // Save transcripts to Supabase
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .insert([
          { 
            meeting_id: meetingId,
            transcript: transcripts
          }
        ]);

      if (error) {
        console.error('Error saving transcripts:', error);
      }

      // End the meeting
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to end meeting');
      }

      const data = await response.json();

      console.log('Received updated meeting:', data.meeting);

      if (!data.success) {
        throw new Error(data.error || 'Failed to update meeting');
      }

      // Update meetings list with the updated meeting
      setMeetings(prev => 
        prev.map(m => 
          m.id === meetingId ? data.meeting : m
        )
      );

      setCurrentMeeting(null);

      if (redirect) {
        await router.push('/dashboard');
      }

      return data;
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  };

  const scheduleMeeting = async (title: string, date: string) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          status: 'scheduled'
        })
      });
      const data = await response.json();
      setScheduledMeetings(prev => [...prev, data.meeting]);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      throw error;
    }
  };

  const getRecentMeetings = () => meetings.filter(m => m.status === 'ended');
  const getScheduledMeetings = () => scheduledMeetings;

  const fetchTranscripts = async (meetingId: string) => {
    const { data: transcripts, error } = await supabase
      .from('meeting_transcripts')
      .select('transcript, created_at')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });
  
    if (error) {
      console.error('Error fetching transcripts:', error);
      return [];
    }
  
    return transcripts.map(t => t.transcript);
  };

  // Add error and loading state to the context value
  const value = {
    meetings,
    scheduledMeetings,
    currentMeeting,
    isLoading,
    error,
    startMeeting,
    scheduleMeeting,
    joinMeeting,
    endMeeting,
    fetchMeetings
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}