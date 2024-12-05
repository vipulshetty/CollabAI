'use client';
import { useMeeting } from '@/context/MeetingContext';

export default function ParticipantList() {
  const { participants = [] } = useMeeting();

  return (
    <div className="fixed left-4 top-24 bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="font-semibold mb-4">Participants ({participants.length})</h3>
      <div className="space-y-2">
        {participants.map((participantId) => (
          <div key={participantId} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Participant {participantId}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 