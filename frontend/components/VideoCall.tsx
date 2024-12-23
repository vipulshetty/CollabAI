'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingContext } from '@/contexts/MeetingContext';
import VideoControls from './VideoControls';
import ParticipantVideo from './ParticipantVideo';
import ChatSystem from './ChatSystem';
import { socketService } from '@/services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptionService } from '@/services/TranscriptionService';
import RecordingService from '@/services/RecordingService';
import Whiteboard from './Whiteboard';

interface VideoCallProps {
  peerId: string;
}

const getGridLayout = (totalParticipants: number): string => {
  if (totalParticipants <= 1) return 'grid-cols-1';
  if (totalParticipants === 2) return 'grid-cols-2';
  if (totalParticipants <= 4) return 'grid-cols-2';
  if (totalParticipants <= 6) return 'grid-cols-3';
  if (totalParticipants <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
};

const getGridSize = (totalParticipants: number): string => {
  if (totalParticipants <= 1) return 'h-full max-w-3xl mx-auto';
  if (totalParticipants === 2) return 'h-full max-w-4xl mx-auto';
  if (totalParticipants <= 4) return 'h-full max-w-5xl mx-auto';
  return 'h-full w-full';
};

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
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string>('');

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
        handleTranscriptionResult(data);
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
      if (!peerId) {
        console.error('No meeting ID available');
        router.push('/dashboard');
        return;
      }

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

  const generateSummary = async () => {
    try {
      setIsSummarizing(true);
      const response = await fetch(`/api/meetings/${currentMeeting?.id}/summary`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranscriptionResult = (result: any) => {
    const transcript = result.results[0]?.alternatives[0]?.transcript || '';
    if (transcript) {
      setTranscriptText(prev => prev + ' ' + transcript);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-[#1a1b1e] rounded-2xl overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-4 ${getGridSize(participants.length + 1)}`}
        >
          <div className={`h-full grid ${getGridLayout(participants.length + 1)} gap-4 auto-rows-fr`}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative aspect-video rounded-xl overflow-hidden bg-black/30"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg"
              >
                <span className="text-white text-sm">You</span>
              </motion.div>
            </motion.div>
            
            {participants.map((participantId, index) => (
              <motion.div
                key={participantId}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                className="relative aspect-video rounded-xl overflow-hidden bg-black/30"
              >
                <ParticipantVideo
                  participantId={participantId}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {showChat && socketReady && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-4 right-4 bottom-24 w-80 max-w-[calc(100%-2rem)] z-50"
            >
              <div className="h-full flex flex-col bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex-1 overflow-hidden">
                  <ChatSystem 
                    socket={socketRef.current}
                    roomId={peerId}
                    onClose={() => setShowChat(false)}
                    minimized={false}
                    onMinimize={() => setShowChat(!showChat)}
                    username="You"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSummary('')}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-white">Meeting Summary</h3>
                <div className="bg-black/30 rounded-xl p-4 text-gray-200 whitespace-pre-wrap">
                  {summary}
                </div>
                <button
                  onClick={() => setSummary('')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent backdrop-blur-sm"
        >
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
            onGenerateSummary={generateSummary}
            isSummarizing={isSummarizing}
          />
        </motion.div>

        <AnimatePresence>
          {showWhiteboard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-4 z-50 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center"
            >
              <Whiteboard 
                isOpen={showWhiteboard} 
                onClose={() => setShowWhiteboard(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}