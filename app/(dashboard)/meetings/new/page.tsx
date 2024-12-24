'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingContext } from '@/contexts/MeetingContext';
import { Video, Calendar, Copy, Share2 } from 'lucide-react';

export default function NewMeetingPage() {
  const router = useRouter();
  const { scheduleMeeting, createMeeting } = useMeetingContext();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await scheduleMeeting({ title, date });
      router.push('/dashboard');
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const createInstantMeeting = async () => {
    try {
      setLoading(true);
      setError(null);
      const meetingId = await createMeeting({
        title: `Instant Meeting - ${new Date().toLocaleString()}`,
        instant: true,
      });
      const link = `${window.location.origin}/meetings/join/${meetingId}`;
      setMeetingLink(link);
    } catch (err) {
      console.error('Failed to create instant meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to create instant meeting');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (meetingLink) {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinMeeting = () => {
    if (meetingLink) {
      const meetingId = meetingLink.split('/').pop();
      router.push(`/meetings/join/${meetingId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Instant Meeting Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Video className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Instant Meeting</h2>
          </div>
          
          {!meetingLink ? (
            <button
              onClick={createInstantMeeting}
              disabled={loading}
              className={`w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Create Instant Meeting
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={meetingLink}
                  readOnly
                  className="flex-1 bg-transparent outline-none"
                />
                <button
                  onClick={copyLink}
                  className="p-2 text-gray-600 hover:text-blue-500"
                >
                  {copied ? (
                    <span className="text-green-500 text-sm">Copied!</span>
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={joinMeeting}
                  className="py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
                >
                  <Video className="w-5 h-5" />
                  Join Now
                </button>
                <button
                  onClick={copyLink}
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200"
                >
                  <Share2 className="w-5 h-5" />
                  Share Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Meeting Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Schedule Meeting</h2>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Team Sync"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Date & Time
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !title || !date}
              className={`w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2
                ${(loading || !title || !date) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Schedule Meeting
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
