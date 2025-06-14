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
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        // Check if stream has video tracks
        setHasVideoTrack(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
      } else {
        // Clear the video element when stream is removed
        videoRef.current.srcObject = null;
        setHasVideoTrack(false);
        console.log('🔴 Cleared video srcObject for participant:', participantId);
      }
    }
  }, [stream, participantId]);

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

  // Cleanup video element on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log('🔴 Component unmount: Cleared video srcObject for participant:', participantId);
      }
    };
  }, [participantId]);

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
          style={{
            transform: 'scale(1)',
            WebkitTransform: 'scale(1)',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className={`w-full h-full ${layout === 'spotlight' ? 'object-cover' : 'object-contain'}`}
        />
      )}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-xl text-white text-sm font-medium border border-white/10 shadow-lg">
        {isLocal ? 'You' : `Participant ${participantId}`}
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
        />
      </div>
    </motion.div>
  );
}