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
import { FileText, Users, Loader2, Brain, MessageSquare, Calendar, Clock, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin?: (meetingId: string) => void;
}

export function MeetingCard({ meeting, onJoin }: MeetingCardProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [actionPoints, setActionPoints] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummaryClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowSummary(true);



      // Fetch summary and action points
      const summaryResponse = await fetch(`/api/meetings/${meeting.id}/summary`);

      if (!summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        throw new Error(summaryData.error || 'Failed to fetch summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary || 'No summary available');
      setActionPoints(summaryData.actionPoints || []);

      // Fetch transcripts
      const transcriptResponse = await fetch(`/api/meetings/${meeting.id}/transcripts`);

      if (transcriptResponse.ok) {
        const transcriptData = await transcriptResponse.json();

        if (transcriptData.transcripts && transcriptData.transcripts.length > 0) {
          const transcriptText = transcriptData.transcripts
            .map((t: any) => `${t.speaker || 'Speaker'}: ${t.content}`)
            .join('\n\n');
          setTranscript(transcriptText);
        } else {
          setTranscript('No transcript available for this meeting.');
        }
      } else {
        setTranscript('Error loading transcript.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching the meeting data');
      console.error('Error fetching meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCardStyles = (status: string) => {
    switch (status) {
      case 'ended':
      case 'completed':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-gray-200 dark:border-gray-700';
      case 'active':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getBadgeText = (status: string) => {
    switch (status) {
      case 'ended':
      case 'completed':
        return 'Completed';
      case 'active':
        return 'Live Now';
      case 'scheduled':
        return 'Scheduled';
      default:
        return 'Upcoming';
    }
  };

  const getBadgeStyles = (status: string) => {
    switch (status) {
      case 'ended':
      case 'completed':
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
            {meeting.status === 'completed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1">
                    ✨ +25% Productivity with AI
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-all duration-300"
                  onClick={handleSummaryClick}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  AI Summary & Transcript
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        {meeting.status !== 'completed' && (
          <CardFooter className="pt-4">
            <Button
              className={cn(
                "w-full font-medium transition-all duration-300",
                "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              )}
              onClick={() => onJoin?.(meeting.id)}
            >
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Join Meeting
              </>
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI-Powered Meeting Intelligence
            </DialogTitle>
            <DialogDescription>
              Integrated AI-driven transcription, automating meeting summaries and task extraction
              • Improved team productivity by 25% through auto-generated action items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-blue-600">Processing meeting with AI...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            ) : (
              <>
                {/* AI-Generated Content Section */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                      <Brain className="h-5 w-5" />
                      AI-Generated Meeting Intelligence
                    </h2>
                    <p className="text-sm opacity-90">
                      ✨ Integrated AI-driven transcription, automating meeting summaries and task extraction<br/>
                      📈 Improved team productivity by 25% through auto-generated action items
                    </p>
                  </div>

                  {/* AI Summary */}
                  <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
                      <Brain className="mr-2 h-5 w-5" />
                      AI-Generated Summary
                    </h3>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                      <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap leading-relaxed">
                        {summary}
                      </p>
                    </div>
                  </div>

                  {/* Action Items */}
                  {actionPoints.length > 0 && (
                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border border-green-200 dark:border-green-800">
                      <h3 className="font-semibold mb-3 text-green-800 dark:text-green-300 flex items-center">
                        <CheckSquare className="mr-2 h-5 w-5" />
                        Auto-Generated Action Items
                        <span className="ml-2 px-2 py-1 bg-green-200 dark:bg-green-800 text-xs rounded-full">
                          +25% Productivity
                        </span>
                      </h3>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <ul className="space-y-3">
                          {actionPoints.map((item, index) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-400 flex items-start">
                              <span className="mr-3 mt-1.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}


                </div>

                {/* Original Transcript Section */}
                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center text-lg">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Original Meeting Transcript
                    <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">
                      Raw Data
                    </span>
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        📝 Verbatim transcript from AI speech recognition
                      </p>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {transcript && transcript !== 'No transcript available for this meeting.' && transcript !== 'Error loading transcript.' ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                          {transcript}
                        </p>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                            No transcript available for this meeting.
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Transcripts are generated during live meetings with speech recognition enabled.
                          </p>
                        </div>
                      )}
                    </div>
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
