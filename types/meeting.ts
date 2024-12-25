<<<<<<< HEAD
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
=======
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
>>>>>>> 37ced96db7303ba0089a72bc9ba2948d5bb108c4

export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  transcript: string;
  created_by: string | null;
  created_at: string;
<<<<<<< HEAD
}
=======
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
>>>>>>> 37ced96db7303ba0089a72bc9ba2948d5bb108c4
