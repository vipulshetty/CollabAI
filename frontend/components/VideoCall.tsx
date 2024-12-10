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
import { RecordingService } from '@/services/RecordingService';
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
  const { endMeeting, currentMeeting } = useMeeting();
  const [showChat, setShowChat] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isEndingRef = useRef(false);
  const endCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const recordingService = new RecordingService();

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
    if (socketReady) {
      const socket = socketService.getSocket();
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

  const handleEndMeeting = async () => {  // Add 'async' here
  try {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    if (transcriptionService) {
      transcriptionService.stop();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allTranscripts = transcriptionService.getTranscripts();
      console.log('Final transcripts:', allTranscripts);
  
        // Only attempt to save if there are transcripts
        if (allTranscripts.length > 0) {
          const socket = socketService.getSocket();
          
          if (socket && socket.connected) {
            try {
              console.log('Saving transcripts...');
              
              await new Promise<void>((resolve, reject) => {
                socket.emit('save-meeting-transcripts', {
                  meetingId: peerId,
                  transcripts: allTranscripts
                }, (response: { success: boolean, error?: string }) => {
                  console.log('Save Transcript Response:', response);
                  
                  if (response.success) {
                    resolve();
                  } else {
                    reject(new Error(response.error || 'Failed to save transcripts'));
                  }
                });
  
                // Add a timeout
                setTimeout(() => {
                  reject(new Error('Transcript save timeout'));
                }, 10000);
              });
  
              console.log('Transcripts saved successfully');
            } catch (error) {
              console.error('Failed to save transcripts:', error);
              // Optionally, save transcripts locally or implement a retry mechanism
            }
          } else {
            console.error('Socket not connected', {
              socket: !!socket,
              connected: socket?.connected
            });
          }
        }
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const meetingId = currentMeeting?.id || `meeting-${peerId}`;
      await endMeeting(meetingId, false);

      setLocalStream(null);
      setParticipants([]);
      setTranscriptionService(null);
      setIsTranscribing(false);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error ending meeting:', error);
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

  const handleStartRecording = async () => {
    if (!localStream) return;
    const started = await recordingService.startRecording(localStream);
    if (started) {
      setIsRecording(true);
    }
  };

  const handleStopRecording = async () => {
    const blob = await recordingService.stopRecording();
    if (blob) {
      recordingService.downloadRecording(blob);
    }
    setIsRecording(false);
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
            onEndCall={handleEndMeeting}
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
            endMeeting={handleEndMeeting}
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