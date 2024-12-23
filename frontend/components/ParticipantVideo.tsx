'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Camera, CameraOff } from 'lucide-react';

interface ParticipantVideoProps {
  participantId: string;
  layout: 'grid' | 'spotlight';
  stream?: MediaStream;
  isLocal?: boolean;
  isVideoOff?: boolean;
  profileImage?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ParticipantVideo({ 
  participantId, 
  layout, 
  stream, 
  isLocal,
  isVideoOff,
  profileImage 
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      // Check if stream has video tracks
      setHasVideoTrack(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
    }
  }, [stream]);

  // Monitor video track changes
  useEffect(() => {
    if (!stream) return;

    const handleTrackEnabled = () => setHasVideoTrack(true);
    const handleTrackDisabled = () => setHasVideoTrack(false);

    stream.getVideoTracks().forEach(track => {
      track.addEventListener('enabled', handleTrackEnabled);
      track.addEventListener('disabled', handleTrackDisabled);
    });

    return () => {
      stream.getVideoTracks().forEach(track => {
        track.removeEventListener('enabled', handleTrackEnabled);
        track.removeEventListener('disabled', handleTrackDisabled);
      });
    };
  }, [stream]);

  const showProfileImage = isVideoOff || !hasVideoTrack;

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
      {showProfileImage ? (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          {profileImage ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              <Image
                src={profileImage}
                alt={`${participantId}'s profile`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
              {getInitials(isLocal ? 'You' : `Participant ${participantId}`)}
            </div>
          )}
          <div className="absolute top-4 right-4">
            <CameraOff className="w-6 h-6 text-white/60" />
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${layout === 'spotlight' ? 'object-cover' : 'object-contain'}`}
        />
      )}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium">
        {isLocal ? 'You' : `Participant ${participantId}`}
      </div>
    </motion.div>
  );
}