'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoCall from '@/components/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { MeetingProvider } from '@/contexts/MeetingContext';

interface Meeting {
  id: string;
  title: string;
  meeting_url: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function MeetingVideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const meetingId = params?.id;
        if (!meetingId || typeof meetingId !== 'string') {
          throw new Error('Invalid meeting ID');
        }

        const response = await fetch(`/api/meetings/${meetingId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch meeting');
        }

        const { meeting } = await response.json();
        if (!meeting) {
          throw new Error('Meeting not found');
        }

        if (meeting.status !== 'scheduled') {
          throw new Error('This meeting has ended');
        }

        setMeeting(meeting);
      } catch (error) {
        console.error('Error fetching meeting:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch meeting');
      }
    };

    fetchMeeting();
  }, [params?.id]);

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
            <div className="flex items-center justify-center">
              <p>Loading meeting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MeetingProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Leave Meeting
            </Button>
          </div>
          
          <VideoCall peerId={meeting.id} />
        </div>
      </div>
    </MeetingProvider>
  );
}
