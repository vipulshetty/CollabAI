'use client';
import { useEffect, useRef } from 'react';

interface ParticipantVideoProps {
  participantId: string;
  layout: 'grid' | 'spotlight';
}

export default function ParticipantVideo({ participantId, layout }: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className={`relative rounded-lg overflow-hidden ${
      layout === 'grid' ? 'aspect-video' : 'w-full max-w-4xl'
    }`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
        Participant {participantId}
      </div>
    </div>
  );
} 