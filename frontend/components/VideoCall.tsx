'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMeeting } from '@/context/MeetingContext';
import VideoControls from './VideoControls';
import ParticipantVideo from './ParticipantVideo';
import ChatSystem from './ChatSystem';
import { socketService } from '@/services/socketService';
import { motion } from 'framer-motion';
import { TranscriptionService } from '@/services/TranscriptionService';

interface VideoCallProps {
  peerId: string;
}

export default function VideoCall({ peerId }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { endMeeting, currentMeeting } = useMeeting();
  const [showChat, setShowChat] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isEndingRef = useRef(false);
  const endCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const socket = socketService.initSocket();
    
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setSocketReady(true);
        socket.emit('join-room', { roomId: peerId });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setSocketReady(false);
      });

      if (!socket.connected) {
        console.log('Socket not connected, attempting to connect...');
        socket.connect();
      } else {
        setSocketReady(true);
        socket.emit('join-room', { roomId: peerId });
      }

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        if (socket.connected) {
          socket.disconnect();
        }
      };
    }
  }, [peerId]);

  useEffect(() => {
    const socket = socketService.getSocket();
    console.log('Socket connection status:', {
      socket: !!socket,
      connected: socket?.connected,
      socketReady,
      showChat
    });
  }, [socketReady, showChat]);

  useEffect(() => {
    if (socketService.getSocket()) {
      console.log('Initializing transcription service...');
      const service = new TranscriptionService(
        socketService.getSocket()!,
        peerId,
        {
          continuous: true,
          interimResults: true,
          language: 'en-US'
        }
      );
      setTranscriptionService(service);
      setIsTranscribing(true);

      socketService.getSocket()!.on('transcription', (data: { transcript: string }) => {
        console.log('Received Transcript:', data.transcript);
        setTranscripts(prev => [...prev, data.transcript]);
      });

      service.start();
      console.log('Transcription service started automatically');

      return () => {
        console.log('Cleaning up transcription service...');
        service.stop();
        socketService.getSocket()?.off('transcription');
      };
    }
  }, [peerId]);

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleEndCall = async () => {
    try {
      if (isEndingRef.current) return;
      isEndingRef.current = true;

      // Stop transcription first
      if (transcriptionService) {
        transcriptionService.stop();
      }

      // Get all transcripts
      const serviceTranscripts = transcriptionService?.getTranscripts() || [];
      const transcriptElements = document.querySelectorAll('[data-transcript]');
      const displayedTexts = Array.from(transcriptElements).map(el => el.textContent || '');
      
      // Combine all possible transcript sources
      const allTranscripts = [
        ...new Set([
          ...transcripts,
          ...serviceTranscripts,
          ...displayedTexts
        ])
      ].filter(Boolean);

      if (allTranscripts.length > 0 && currentMeeting?.id) {
        // Try multiple methods to save
        const socket = socketService.getSocket();
        
        // Method 1: Socket emit with acknowledgment
        if (socket?.connected) {
          socket.emit('transcription-end', {
            roomId: currentMeeting.id,
            transcripts: allTranscripts
          });
        }

        // Method 2: Direct API call
        try {
          await fetch('/api/meetings/transcripts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              meetingId: currentMeeting.id,
              transcripts: allTranscripts
            })
          });
        } catch (error) {
          console.error('API save failed:', error);
        }
      }

      // Clean up and end meeting
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      if (currentMeeting?.id) {
        await endMeeting(currentMeeting.id, true);
      }
    } catch (error) {
      console.error('Error during call end:', error);
      router.push('/dashboard');
    } finally {
      isEndingRef.current = false;
    }
  };

  const handleToggleTranscription = () => {
    if (transcriptionService) {
      if (isTranscribing) {
        transcriptionService.stop();
        setIsTranscribing(false);
      } else {
        transcriptionService.start();
        setIsTranscribing(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (transcriptionService) {
        transcriptionService.stop();
      }
    };
  }, [transcriptionService]);

  useEffect(() => {
    return () => {
      if (endCallTimeoutRef.current) {
        clearTimeout(endCallTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 bg-[#1a1b1e]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
          <div className="relative rounded-xl overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg">
              <span className="text-white text-sm">You</span>
            </div>
          </div>
          {participants.map((participantId) => (
            <ParticipantVideo
              key={participantId}
              participantId={participantId}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <VideoControls
            onEndCall={handleEndCall}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleTranscription={handleToggleTranscription}
            isTranscribing={isTranscribing}
          />
        </div>

        {showChat && socketReady && (
          <div className="absolute right-4 bottom-20 z-50">
            <ChatSystem 
              socket={socketService.getSocket()!}
              roomId={peerId}
              onClose={() => setShowChat(false)}
              minimized={false}
              onMinimize={() => setShowChat(!showChat)}
              username="You"
            />
          </div>
        )}
      </div>
    </div>
  );
}