'use client';

import { FC, useState, useEffect, useCallback } from 'react';
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
import { Loader2, Brain } from 'lucide-react';

interface MeetingTranscriptsProps {
  meetingId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MeetingTranscripts: FC<MeetingTranscriptsProps> = ({ meetingId }) => {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const fetchTranscripts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setTranscripts(data || []);

      // Set summary if any transcript has it
      const existingSummary = data?.find(t => t.summary)?.summary;
      if (existingSummary) {
        setSummary(existingSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  }, [meetingId, setLoading, setTranscripts, setSummary, setError]);

  useEffect(() => {
    if (open) {
      fetchTranscripts();

      // Subscribe to changes
      const channel = supabase
        .channel('meeting_transcripts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meeting_transcripts',
            filter: `meeting_id=eq.${meetingId}`
          },
          () => {
            fetchTranscripts();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [open, meetingId, fetchTranscripts]);

  const handleGenerateSummary = async () => {
    if (summary) {
      setOpen(true);
      return;
    }

    try {
      setIsGeneratingSummary(true);
      setOpen(true);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout
      
      const response = await fetch(`/api/meetings/${meetingId}/summary`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Summary generation failed:', errorData);
        throw new Error('Failed to generate summary. Please try again.');
      }

      const data = await response.json();
      const newSummary = data.summary;
      setSummary(newSummary);

      // Refresh transcripts to get updated summary
      fetchTranscripts();
    } catch (err) {
      console.error('Error in handleGenerateSummary:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Summary generation is taking longer than expected. Please try again or contact support.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary}
        >
          {isGeneratingSummary ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Summary...
            </>
          ) : (
            summary ? 'View Summary' : 'Generate Summary'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI-Powered Meeting Intelligence
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your meeting content with automated summaries and action item extraction
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : !summary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Generating summary...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">AI Summary</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Meeting Transcripts</h4>
                {transcripts.map((transcript) => (
                  <div key={transcript.id} className="mb-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{transcript.speaker}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transcript.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{transcript.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingTranscripts;
