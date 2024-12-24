'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import VideoCall from '@/components/VideoCall';
import { useMeetingContext } from '@/contexts/MeetingContext';

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const { joinMeeting } = useMeetingContext();

  useEffect(() => {
    if (meetingId && typeof meetingId === 'string') {
      joinMeeting(meetingId);
    }
  }, [meetingId, joinMeeting]);

  return <VideoCall peerId={meetingId as string} />;
}