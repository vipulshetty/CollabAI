'use client';

import { FC } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Meeting } from '@/types/meeting';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentMeetingsProps {
  meetings: Meeting[];
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Date not available';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

const RecentMeetings: FC<RecentMeetingsProps> = ({ meetings }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent meetings</p>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="space-y-1">
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="font-medium hover:underline"
                  >
                    {meeting.title}
                  </Link>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(meeting.endTime)}
                    </p>
                    <Badge variant="secondary">
                      {meeting.participants?.length || 0} participants
                    </Badge>
                  </div>
                </div>
                {meeting.recordingUrl && (
                  <Link
                    href={`/meetings/${meeting.id}/recording`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Recording
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentMeetings;
