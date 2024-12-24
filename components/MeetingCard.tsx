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
} from "@/components/ui/dialog";
import { FileText, Users, Loader2, Brain, MessageSquare, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

      const response = await fetch(`/api/meetings/${meeting.meeting_id}/transcript`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch transcript');
      }
      
      const data = await response.json();
      
      if (data.transcript) {
        setTranscript(data.transcript);
        setSummary(data.summary || 'Generating summary...');

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

  const getCardStyles = (status: string) => {
    switch (status) {
      case 'ended':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-200 dark:border-gray-700';
      case 'active':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ended':
        return 'secondary';
      case 'active':
        return 'success';
      default:
        return 'outline';
    }
  };

  const getBadgeText = (status: string) => {
    switch (status) {
      case 'ended':
        return 'Completed';
      case 'active':
        return 'Live Now';
      default:
        return 'Upcoming';
    }
  };

  const getBadgeStyles = (status: string) => {
    switch (status) {
      case 'ended':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'active':
        return 'bg-green-500 text-white animate-pulse';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <>
      <Card className={cn(
        "relative overflow-hidden rounded-xl border transform transition-all duration-300 hover:shadow-xl",
        getCardStyles(meeting.status)
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 flex-1 mr-4">
            <CardTitle className="text-lg font-semibold line-clamp-2 text-gray-800 dark:text-gray-200">
              {meeting.title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {meeting.description || 'No description provided'}
            </p>
          </div>
          <Badge 
            variant={getBadgeVariant(meeting.status)}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              getBadgeStyles(meeting.status)
            )}
          >
            {getBadgeText(meeting.status)}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="mr-1.5 h-4 w-4" />
                  <span>{meeting.participants?.length || 0} participants</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            {meeting.status === 'ended' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  onClick={handleSummaryClick}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  View Summary
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        {meeting.status !== 'ended' && (
          <CardFooter className="pt-4">
            <Button
              className={cn(
                "w-full font-medium transition-all duration-300",
                meeting.status === 'active' 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              )}
              onClick={() => onJoin?.(meeting.meeting_id)}
            >
              {meeting.status === 'active' ? (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Join Now
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Details
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meeting Summary</DialogTitle>
            <DialogDescription>
              AI-generated summary and transcript of the meeting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    AI Summary
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap">
                    {summary}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Full Transcript
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {transcript}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
