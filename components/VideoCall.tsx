'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMeetingContext } from '@/contexts/MeetingContext';
import VideoControls from './VideoControls';
import ParticipantVideo from './ParticipantVideo';
import ChatSystem from './ChatSystem';
import { socketService } from '@/services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptionService } from '@/services/TranscriptionService';
import RecordingService from '@/services/RecordingService';
import Whiteboard from './Whiteboard';
import Video from './icons/Video';
import VideoOff from './icons/VideoOff';
import Mic from './icons/Mic';
import MicOff from './icons/MicOff';
import Image from 'next/image';

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
  const { data: session } = useSession();
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
  const [messages, setMessages] = useState<Array<{ content: string; sender: string; isLocal: boolean }>>([]);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [peerConnections, setPeerConnections] = useState<{ [key: string]: RTCPeerConnection }>({});

  // Event handler functions
  const handleUserJoined = useCallback(async (userId: string) => {
    console.log('User joined:', userId);
    
    // Create new peer connection for the user
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });
    
    // Add local tracks to the connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }
    
    setPeerConnections(prev => ({
      ...prev,
      [userId]: peerConnection
    }));
    
    setParticipants(prev => [...prev, userId]);
  }, [localStream]);

  const handleUserLeft = useCallback((userId: string) => {
    console.log('User left:', userId);
    
    // Clean up peer connection
    if (peerConnections[userId]) {
      peerConnections[userId].close();
      setPeerConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[userId];
        return newConnections;
      });
    }
    
    setParticipants(prev => prev.filter(id => id !== userId));
  }, [peerConnections]);

  const handleOffer = useCallback(async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
    console.log('Received offer from:', from);
    const peerConnection = peerConnections[from];
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = socketService.initSocket();
      socket?.emit('answer', { to: from, answer });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [peerConnections]);

  const handleAnswer = useCallback(async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
    console.log('Received answer from:', from);
    const peerConnection = peerConnections[from];
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, [peerConnections]);

  const handleIceCandidate = useCallback(({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
    console.log('Received ICE candidate from:', from);
    const peerConnection = peerConnections[from];
    if (!peerConnection) return;

    try {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [peerConnections]);

  useEffect(() => {
    recordingServiceRef.current = new RecordingService();
    return () => {
      recordingServiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const constraints = {
          video: {
            width: { min: 640, ideal: 1024, max: 1024 },
            height: { min: 480, ideal: 576, max: 576 },
            frameRate: { min: 15, ideal: 15, max: 15 },
            facingMode: 'user'
          },
          audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set initial track states
        stream.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setIsVideoOff(true);
        setIsMuted(true);
      }
    };

    initializeMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [isMuted]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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

  useEffect(() => {
    const socket = socketService.initSocket();
    if (!socket || !localStream) return;

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [localStream, handleUserJoined, handleUserLeft]);

  useEffect(() => {
    const socket = socketService.initSocket();
    if (!socket || !localStream) return;

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [localStream, handleOffer, handleAnswer, handleIceCandidate]);

  useEffect(() => {
    const socket = socketService.initSocket();
    if (!socket) return;

    const handleChatMessage = (data: { content: string; sender: string }) => {
      console.log('Received chat message:', data);
      if (data.sender !== session?.user?.name) {
        setMessages(prev => [...prev, {
          content: data.content,
          sender: data.sender,
          isLocal: false
        }]);
      }
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [session?.user?.name]);

  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

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

  const toggleVideo = useCallback(async () => {
    if (!localStream) return;

    try {
      const videoTracks = localStream.getVideoTracks();
      
      if (!isVideoOff) {
        // Turn off video
        videoTracks.forEach(track => {
          track.enabled = false;
          track.stop(); // Stop the track
        });
        
        // Remove video tracks from peer connections
        Object.values(peerConnections).forEach(pc => {
          const senders = pc.getSenders();
          senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
              pc.removeTrack(sender);
            }
          });
        });
        
        setIsVideoOff(true);
        
        // Clear video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      } else {
        // Turn on video
        try {
          const constraints = {
            video: {
              width: { min: 640, ideal: 1024, max: 1024 },
              height: { min: 480, ideal: 576, max: 576 },
              frameRate: { min: 15, ideal: 15, max: 15 },
              facingMode: 'user'
            }
          };

          const videoStream = await navigator.mediaDevices.getUserMedia(constraints);
          const newVideoTrack = videoStream.getVideoTracks()[0];
          
          // Create a new stream with the video track and existing audio track
          const audioTrack = localStream.getAudioTracks()[0];
          const updatedStream = new MediaStream();
          if (audioTrack) updatedStream.addTrack(audioTrack);
          updatedStream.addTrack(newVideoTrack);
          
          // Update local state and video element
          setLocalStream(updatedStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = updatedStream;
          }

          // Update peer connections
          Object.values(peerConnections).forEach(pc => {
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(newVideoTrack);
            } else {
              pc.addTrack(newVideoTrack, updatedStream);
            }
          });

          setIsVideoOff(false);
        } catch (error) {
          console.error('Error turning on video:', error);
          setIsVideoOff(true);
        }
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }, [localStream, isVideoOff, peerConnections]);

  const handleToggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        // Notify peer connections of audio state
        Object.values(peerConnections).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) {
            sender.track!.enabled = audioTrack.enabled;
          }
        });
      }
    }
  }, [localStream, peerConnections]);

  const handleToggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard);
  };

  const handleSendMessage = (content: string) => {
    console.log('Sending message:', content);
    if (socketService.socket) {
      const messageData = {
        roomId: peerId,
        content,
        sender: session?.user?.name || 'Anonymous',
        timestamp: new Date().toISOString()
      };
      
      console.log('Emitting chat message:', messageData);
      socketService.socket.emit('chat-message', messageData);

      setMessages(prev => [...prev, {
        content,
        sender: session?.user?.name || 'Anonymous',
        isLocal: true
      }]);
    } else {
      console.error('Socket not connected');
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      // Add your summary generation logic here
      // For now, we'll just combine all transcripts
      const summary = transcripts.join(' ');
      setSummary(summary);
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

  const handleEndMeeting = async () => {
    if (!currentMeeting?.id || isEndingRef.current) return;
    isEndingRef.current = true;

    try {
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Stop recording if active
      if (isRecording && recordingServiceRef.current) {
        await handleStopRecording();
      }

      // Stop transcription if active
      if (isTranscribing && transcriptionService) {
        transcriptionService.stop();
      }

      // Disconnect all peer connections
      Object.values(peerConnections).forEach(pc => pc.close());
      setPeerConnections({});

      // Send end meeting request to server
      const response = await fetch(`/api/meetings/${currentMeeting.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcripts.join('\n')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to end meeting');
      }

      // Clean up socket connection
      socketService.disconnect();

      // Navigate back to dashboard
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
              <div className={`relative w-full h-full rounded-lg overflow-hidden ${isVideoOff ? 'bg-gray-900' : ''}`}>
                {isVideoOff ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 relative rounded-full overflow-hidden ring-4 ring-indigo-500/30">
                        {session?.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-white">
                              {session?.user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm font-medium">
                        Camera is turned off
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {session?.user?.name || 'User'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform ${
                      isVideoOff ? 'scale-x-0' : 'scale-x-100'
                    } transition-transform duration-300`}
                  />
                )}
              </div>
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
                  layout="grid"
                  stream={null}
                  isLocal={false}
                  isVideoOff={false}
                  profileImage={null}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-4 top-4 bottom-32 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
            >
              <ChatSystem
                messages={messages}
                onSendMessage={handleSendMessage}
                transcripts={transcripts}
                transcriptText={transcriptText}
                summary={summary}
                isSummarizing={isSummarizing}
                onRequestSummary={generateSummary}
              />
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
            isVideoOff={isVideoOff}
            isMuted={isMuted}
            onToggleVideo={toggleVideo}
            onToggleAudio={handleToggleAudio}
            onToggleTranscription={handleToggleTranscription}
            isTranscribing={isTranscribing}
            onToggleRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            isRecording={isRecording}
            onToggleWhiteboard={handleToggleWhiteboard}
            showWhiteboard={showWhiteboard}
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