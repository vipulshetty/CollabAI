'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Calendar } from 'lucide-react';

export default function CreateMeetingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>('instant');

  const handleCreateMeeting = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!title.trim()) {
        setError('Please enter a meeting title');
        return;
      }

      if (meetingType === 'scheduled' && !scheduledDate) {
        setError('Please select a meeting date and time');
        return;
      }

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status: meetingType === 'instant' ? 'scheduled' : 'scheduled',
          scheduled_date: meetingType === 'instant' 
            ? new Date().toISOString() 
            : new Date(scheduledDate).toISOString(),
          meeting_url: meetingType === 'instant' 
            ? `/video-call/${Date.now()}` // Generate a unique URL for instant meetings
            : null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create meeting');
      }

      const { meeting } = await response.json();

      if (meetingType === 'instant') {
        // For instant meetings, redirect to the video call page
        router.push(`/meetings/${meeting.id}/video-call`);
      } else {
        // For scheduled meetings, go back to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to create meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Meeting</CardTitle>
          <CardDescription>
            Start an instant meeting or schedule one for later
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <Button
                variant={meetingType === 'instant' ? 'default' : 'outline'}
                onClick={() => setMeetingType('instant')}
                className="flex-1"
              >
                <Video className="mr-2 h-4 w-4" />
                Instant Meeting
              </Button>
              <Button
                variant={meetingType === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setMeetingType('scheduled')}
                className="flex-1"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Enter meeting description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {meetingType === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date and Time</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreateMeeting}
                disabled={isLoading}
              >
                {isLoading ? (
                  'Creating...'
                ) : meetingType === 'instant' ? (
                  'Start Meeting'
                ) : (
                  'Schedule Meeting'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}