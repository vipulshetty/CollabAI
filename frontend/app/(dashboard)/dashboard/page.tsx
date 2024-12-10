'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  hasSummary: boolean;
  status: string;
}

export default function DashboardPage() {
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentMeetings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/meetings/recent');
        if (!response.ok) throw new Error('Failed to fetch meetings');
        const data = await response.json();
        setRecentMeetings(data.map((meeting: any) => ({
          ...meeting,
          hasSummary: Boolean(meeting.hasSummary)
        })));
      } catch (error) {
        console.error('Error fetching recent meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentMeetings();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Meeting Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-4">Start a Meeting</h2>
          <Link
            href="/meetings/create"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </Link>
        </motion.div>

        {/* Recent Meetings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md col-span-2"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Meetings</h2>
          <div className="space-y-4">
            {loading ? (
              <p>Loading recent meetings...</p>
            ) : recentMeetings.length > 0 ? (
              recentMeetings.map((meeting) => (
                <div key={meeting.id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{meeting.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/meetings/${meeting.id}`}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                      >
                        Join Meeting
                      </Link>
                      <Link
                        href={`/meetings/${meeting.id}/summaries`}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        View Summary
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent meetings</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 