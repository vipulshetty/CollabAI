'use client';

import { FC } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Meeting } from '@/types/meeting';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MeetingTranscripts from './MeetingTranscripts';

interface UpcomingMeetingsProps {
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

const UpcomingMeetings: FC<UpcomingMeetingsProps> = ({ meetings }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Meetings</CardTitle>
        <Link href="/meetings/create">
          <Button variant="outline" size="sm">
            Schedule Meeting
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming meetings</p>
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
                      {formatDate(meeting.scheduled_date)}
                    </p>
                    <Badge variant={meeting.status === 'scheduled' ? 'outline' : 'secondary'}>
                      {meeting.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {meeting.status === 'completed' && (
                    <MeetingTranscripts meetingId={meeting.id} />
                  )}
                  {meeting.meeting_url && (
                    <Link href={meeting.meeting_url}>
                      <Button variant="outline" size="sm">
                        Join
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMeetings;
