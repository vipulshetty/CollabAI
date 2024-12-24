import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  status: string;
  participants?: { id: string; name: string }[];
}

interface RecentMeetingsProps {
  meetings: Meeting[];
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No recent meetings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Link
          key={meeting.id}
          href={`/meetings/${meeting.id}`}
          className="block p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{meeting.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{meeting.participants?.length || 0}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(meeting.scheduled_date), { addSuffix: true })}
          </div>
        </Link>
      ))}
    </div>
  );
}
