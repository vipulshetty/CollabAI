'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingContext } from '@/contexts/MeetingContext';
import VideoControls from './VideoControls';
import ParticipantVideo from './ParticipantVideo';
import ChatSystem from './ChatSystem';
import { socketService } from '@/services/socketService';
import { motion } from 'framer-motion';
import { TranscriptionService } from '@/services/TranscriptionService';
import RecordingService from '@/services/RecordingService';
import Whiteboard from './Whiteboard';

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
  const { endMeeting, currentMeeting } = useMeetingContext();
  const [showChat, setShowChat] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isEndingRef = useRef(false);
  const endCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const recordingServiceRef = useRef<RecordingService | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    recordingServiceRef.current = new RecordingService();
    return () => {
      recordingServiceRef.current = null;
    };
  }, []);

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
    const setupSocket = () => {
      try {
        socketRef.current = socketService.initSocket();
        if (socketRef.current) {
          socketRef.current.on('connect', () => {
            console.log('Socket connected');
            setSocketReady(true);
          });

          socketRef.current.on('disconnect', () => {
            if (!isEndingRef.current) {  
              console.log('Socket disconnected');
              setSocketReady(false);
            }
          });

          socketRef.current.on('error', (error: any) => {
            console.error('Socket error:', error);
          });
        }
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    setupSocket();

    return () => {
      console.log('Cleaning up socket connection...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socketReady && socketRef.current && peerId) {
      socketRef.current.emit('join-room', { roomId: currentMeeting?.id, peerId });

      socketRef.current.on('user-connected', (userId: string) => {
        console.log('User connected:', userId);
        if (!participants.includes(userId)) {
          setParticipants(prev => [...prev, userId]);
        }
      });

      socketRef.current.on('user-disconnected', (userId: string) => {
        console.log('User disconnected:', userId);
        setParticipants(prev => prev.filter(id => id !== userId));
      });

      return () => {
        socketRef.current?.off('user-connected');
        socketRef.current?.off('user-disconnected');
      };
    }
  }, [socketReady, peerId, currentMeeting?.id, participants]);

  useEffect(() => {
    const socket = socketRef.current;
    
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        setSocketReady(true);
        socket.emit('join-room', { roomId: peerId });
      });

      socket.on('disconnect', () => {
        if (!isEndingRef.current) {  
          console.log('Socket disconnected');
          setSocketReady(false);
        }
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
    const socket = socketRef.current;
    console.log('Socket connection status:', {
      socket: !!socket,
      connected: socket?.connected,
      socketReady,
      showChat
    });
  }, [socketReady, showChat]);

  useEffect(() => {
    if (socketReady) {
      const socket = socketRef.current;
      const service = new TranscriptionService(socket!, peerId);
      setTranscriptionService(service);

      // Start transcription automatically
      service.start();
      setIsTranscribing(true);

      // Listen for transcription updates
      socket?.on('transcription', (data) => {
        console.log('Received transcription:', data);
        setTranscripts(prev => [...prev, data.transcript]);
      });

      socket?.on('transcription-error', (error) => {
        console.error('Transcription error:', error);
      });

      return () => {
        service.stop();
        socket?.off('transcription');
        socket?.off('transcription-error');
      };
    }
  }, [socketReady, peerId]);

  const handleStartRecording = async () => {
    if (!localStream || !recordingServiceRef.current) return;
    
    try {
      const success = await recordingServiceRef.current.startRecording(localStream);
      if (success) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = async () => {
    if (!recordingServiceRef.current) return;
    
    try {
      const recordedBlob = await recordingServiceRef.current.stopRecording();
      if (recordedBlob) {
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleEndCall = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    try {
      // Stop transcription first to save transcripts
      if (transcriptionService) {
        try {
          await transcriptionService.stop();
        } catch (error) {
          console.error('Error stopping transcription:', error);
        }
      }

      // Clean up media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // End meeting
      const response = await fetch(`/api/meetings/${peerId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to end meeting');
      }

      console.log('Meeting ended successfully:', data);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending meeting:', error);
      // Stay on the page if there's an error
      isEndingRef.current = false;
      return;
    }

    // Only set to false if we successfully ended the meeting
    isEndingRef.current = false;
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

  const handleToggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard);
  };

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
            localStream={localStream}
            onEndCall={handleEndCall}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleTranscription={handleToggleTranscription}
            isTranscribing={isTranscribing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            isRecording={isRecording}
            onToggleWhiteboard={handleToggleWhiteboard}
            showWhiteboard={showWhiteboard}
            stream={localStream}
            currentMeeting={peerId}
            endMeeting={handleEndCall}
          />
        </div>

        {showChat && socketReady && (
          <div className="absolute right-4 bottom-20 z-50">
            <ChatSystem 
              socket={socketRef.current}
              roomId={peerId}
              onClose={() => setShowChat(false)}
              minimized={false}
              onMinimize={() => setShowChat(!showChat)}
              username="You"
            />
          </div>
        )}

        {showWhiteboard && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <Whiteboard 
              isOpen={showWhiteboard} 
              onClose={() => setShowWhiteboard(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}