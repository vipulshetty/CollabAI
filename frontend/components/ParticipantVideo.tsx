'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ParticipantVideoProps {
  participantId: string;
  layout: 'grid' | 'spotlight';
  stream?: MediaStream;
  isLocal?: boolean;
}

export default function ParticipantVideo({ participantId, layout, stream, isLocal }: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-lg overflow-hidden ${
        layout === 'grid' 
          ? 'aspect-video w-full' 
          : 'fixed inset-0 w-screen h-screen'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full ${layout === 'spotlight' ? 'object-cover' : 'object-contain'}`}
      />
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium">
        {isLocal ? 'You' : `Participant ${participantId}`}
      </div>
    </motion.div>
  );
}