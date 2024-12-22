export type Meeting = {
  id: string;
  title: string;
  scheduled_date: string;
  created_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  participants: string[];
  meeting_url?: string;
  description?: string;
};

export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript: string;
  created_by: string | null;
  created_at: string;
}