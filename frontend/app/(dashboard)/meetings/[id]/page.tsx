'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, MessageSquare, Users, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Meeting {
  id: string;
  title: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  participants: string[];
  meeting_url?: string;
  description?: string;
  created_at: string;
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Ensure we have a valid ID
        const meetingId = params?.id;
        if (!meetingId || typeof meetingId !== 'string') {
          throw new Error('Invalid meeting ID');
        }

        const response = await fetch(`/api/meetings/${meetingId}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch meeting');
        }
        
        const data = await response.json();
        if (!data.meeting) {
          throw new Error('Meeting not found');
        }
        
        setMeeting(data.meeting);
      } catch (error) {
        console.error('Error fetching meeting:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch meeting');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeeting();
  }, [params?.id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <p>Loading meeting details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p>Meeting not found</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{meeting.title}</CardTitle>
              <CardDescription>
                Scheduled {formatDistanceToNow(new Date(meeting.scheduled_date), { addSuffix: true })}
              </CardDescription>
            </div>
            <Badge variant={meeting.status === 'scheduled' ? 'outline' : 'secondary'}>
              {meeting.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {meeting.description && (
              <div className="space-y-2">
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((participant) => (
                  <Badge key={participant} variant="secondary">
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>

              {meeting.meeting_url && meeting.status === 'scheduled' && (
                <Button onClick={() => window.open(meeting.meeting_url, '_blank')}>
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
