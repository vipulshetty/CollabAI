'use client';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface MeetingStats {
  duration: number;
  participantCount: number;
  speakingTime: Record<string, number>;
  audioLevel: Record<string, number>;
}

interface MeetingAnalyticsProps {
  socket: Socket | null;
  roomId: string;
}

export default function MeetingAnalytics({ socket, roomId }: MeetingAnalyticsProps) {
  const [stats, setStats] = useState<MeetingStats>({
    duration: 0,
    participantCount: 0,
    speakingTime: {},
    audioLevel: {}
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('meeting-stats', (newStats: MeetingStats) => {
      setStats(newStats);
    });

    // Request initial stats
    socket.emit('get-meeting-stats', { roomId });

    return () => {
      socket.off('meeting-stats');
    };
  }, [socket, roomId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed right-4 top-24 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 w-72">
      <h3 className="font-semibold mb-4">Meeting Analytics</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Duration</p>
          <p className="font-medium">{formatTime(stats.duration)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Participants</p>
          <p className="font-medium">{stats.participantCount}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Speaking Time</p>
          {Object.entries(stats.speakingTime).map(([userId, time]) => (
            <div key={userId} className="flex justify-between items-center mb-1">
              <span className="text-sm">User {userId}</span>
              <span className="text-sm font-medium">{formatTime(time)}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Audio Levels</p>
          {Object.entries(stats.audioLevel).map(([userId, level]) => (
            <div key={userId} className="mb-1">
              <div className="flex justify-between text-sm mb-1">
                <span>User {userId}</span>
                <span>{Math.round(level * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${level * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 