'use client';

import { FC, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MeetingTranscriptsProps {
  meetingId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MeetingTranscripts: FC<MeetingTranscriptsProps> = ({ meetingId }) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_transcripts')
          .select('*')
          .eq('meeting_id', meetingId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        setTranscripts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transcripts');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscripts();
  }, [meetingId]);

  if (loading) return <div>Loading transcripts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Transcripts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Meeting Transcripts</DialogTitle>
          <DialogDescription>
            View the transcripts and AI-generated summary of this meeting.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {transcripts.map((transcript, index) => (
            <div key={transcript.id} className="mb-6">
              {transcript.summary && (
                <div className="mb-4 rounded-lg bg-muted p-4">
                  <h4 className="mb-2 font-semibold">AI Summary</h4>
                  <p className="text-sm text-muted-foreground">{transcript.summary}</p>
                </div>
              )}
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{transcript.speaker}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(transcript.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{transcript.content}</p>
              </div>
            </div>
          ))}
          {transcripts.length === 0 && (
            <p className="text-center text-muted-foreground">No transcripts available</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingTranscripts;
