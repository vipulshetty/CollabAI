export interface Meeting {
  id: string;
  meeting_id: string;
  title: string;
  status: 'scheduled' | 'active' | 'ended';
  participants: any[];
  created_by: string | null;
  date: string;
  duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript: string;
  created_by: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      meetings: {
        Row: Meeting;
        Insert: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Meeting, 'id'>>;
      };
      meeting_transcripts: {
        Row: MeetingTranscript;
        Insert: Omit<MeetingTranscript, 'id' | 'created_at'>;
        Update: Partial<Omit<MeetingTranscript, 'id' | 'created_at'>>;
      };
    };
  };
};