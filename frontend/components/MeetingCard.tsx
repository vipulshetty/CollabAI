'use client';

import { useState } from 'react';
import { Meeting } from '@/types/meeting';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Users, Loader2, Brain, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin?: (meetingId: string) => void;
}

export function MeetingCard({ meeting, onJoin }: MeetingCardProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummaryClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowSummary(true);

      // Use meeting_id for the API call
      const response = await fetch(`/api/meetings/${meeting.meeting_id}/transcript`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch transcript');
      }
      
      const data = await response.json();
      
      if (data.transcript) {
        setTranscript(data.transcript);
        setSummary(data.summary || 'Generating summary...');

        // If no summary was generated, show a message
        if (!data.summary) {
          setSummary('Unable to generate summary at this time. Please try again later.');
        }
      } else {
        setError('No transcript available for this meeting');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching the transcript');
      console.error('Error fetching transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ended':
        return 'secondary';
      case 'active':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow w-full h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate flex-1 mr-2">
            {meeting.title}
          </CardTitle>
          <Badge variant={getBadgeVariant(meeting.status)}>
            {meeting.status}
          </Badge>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                {meeting.participants?.length || 0} participants
              </div>
              <div>
                {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
              </div>
            </div>
            {meeting.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {meeting.status === 'active' && onJoin && (
            <Button
              onClick={() => onJoin(meeting.id)}
              variant="default"
              size="sm"
              className="w-full"
            >
              Join Now
            </Button>
          )}
          {meeting.status === 'ended' && (
            <Button
              onClick={handleSummaryClick}
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  View Summary
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Meeting Summary</DialogTitle>
            <DialogDescription>
              Meeting transcript and key points
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="text-red-500 py-4">{error}</div>
            ) : (
              <div className="space-y-6">
                {/* AI Summary Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">🤖 AI Summary</h3>
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {summary || 'No summary available'}
                  </div>
                </div>

                {/* Original Transcript Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">📜 Original Transcript</h3>
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {transcript || 'No transcript available'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
