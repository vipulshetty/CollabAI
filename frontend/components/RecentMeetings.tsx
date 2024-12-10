import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Video } from 'lucide-react';

interface RecentMeetingProps {
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    hasSummary?: boolean;
  }>;
}

export default function RecentMeetings({ meetings }: RecentMeetingProps) {
  const router = useRouter();

  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`);
  };

  const handleViewSummary = (meetingId: string) => {
    router.push(`/meetings/${meetingId}/summaries`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <motion.div
          key={meeting.id}
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{meeting.title}</h3>
            <span className="text-sm text-gray-500">{meeting.date}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleJoinMeeting(meeting.id)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Video size={16} />
              <span>Join</span>
            </button>
            {meeting.hasSummary && (
              <button
                onClick={() => handleViewSummary(meeting.id)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileText size={16} />
                <span>View Summary</span>
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
} 