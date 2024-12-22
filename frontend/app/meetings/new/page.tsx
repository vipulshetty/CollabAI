'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeeting } from '@/contexts/MeetingContext';

export default function NewMeetingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createMeeting } = useMeeting();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>(
    searchParams.get('type') === 'schedule' ? 'scheduled' : 'instant'
  );

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!title.trim()) {
        setError('Please enter a meeting title');
        return;
      }

      if (meetingType === 'scheduled' && !date) {
        setError('Please select a meeting date');
        return;
      }

      const meetingId = await createMeeting({
        title: title.trim(),
        status: meetingType === 'instant' ? 'active' : 'scheduled',
        date: meetingType === 'scheduled' ? date : undefined
      });

      if (meetingType === 'instant') {
        router.push(`/meetings/join/${meetingId}`);
      } else {
        router.push('/meetings/upcoming');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create a Meeting</h1>

      <div className="space-y-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMeetingType('instant')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              meetingType === 'instant'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Video className="w-5 h-5 mr-2" />
            Instant Meeting
          </button>
          <button
            onClick={() => setMeetingType('scheduled')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              meetingType === 'scheduled'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Schedule Meeting
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Meeting Title
            </label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              placeholder="Enter meeting title"
            />
          </div>

          {meetingType === 'scheduled' && (
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Meeting Date and Time
              </label>
              <Input
                type="datetime-local"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <Button
          onClick={handleCreateMeeting}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
          ) : meetingType === 'instant' ? (
            'Start Meeting Now'
          ) : (
            'Schedule Meeting'
          )}
        </Button>
      </div>
    </div>
  );
}
