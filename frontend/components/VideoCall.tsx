'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMeetingContext } from '@/contexts/MeetingContext';
import VideoControls from './VideoControls';
import ParticipantVideo from './ParticipantVideo';
import ChatSystem from './ChatSystem';
import { socketService } from '@/services/socketService';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptionService } from '@/services/TranscriptionService';
import RecordingService from '@/services/RecordingService';
import Whiteboard from './Whiteboard';
import Image from 'next/image';

interface VideoCallProps {
  peerId: string;
}

const getGridLayout = (totalParticipants: number, showChat: boolean): string => {
  // Mobile-first responsive grid
  if (totalParticipants <= 1) return 'grid-cols-1';
  if (totalParticipants === 2) return showChat ? 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2';
  if (totalParticipants <= 4) return showChat ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  if (totalParticipants <= 6) return showChat ? 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3';
  if (totalParticipants <= 9) return showChat ? 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3';
  return showChat ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};

const getGridSize = (totalParticipants: number, showChat: boolean): string => {
  // Use margin instead of padding for better layout control
  if (showChat) {
    if (totalParticipants <= 1) {
      return 'h-full max-w-4xl mx-auto mr-80 xl:mr-96 transition-all duration-300';
    }
    return 'h-full w-full mr-80 xl:mr-96 transition-all duration-300';
  }

  if (totalParticipants <= 1) {
    return 'h-full max-w-4xl mx-auto transition-all duration-300';
  }
  return 'h-full w-full transition-all duration-300';
};

const getVideoAspect = (totalParticipants: number): string => {
  if (totalParticipants <= 1) return 'aspect-video';
  if (totalParticipants <= 4) return 'aspect-video';
  return 'aspect-square';
};

export default function VideoCall({ peerId }: VideoCallProps) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInfo, setParticipantInfo] = useState<{ [socketId: string]: { name: string; email: string; avatar?: string } }>({});
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
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [pendingCandidates, setPendingCandidates] = useState<{ [key: string]: RTCIceCandidateInit[] }>({});

  // Event handler functions
  const handleUserJoined = useCallback(async (data: any) => {
    const userId = typeof data === 'string' ? data : data.socketId;
    const userInfo = typeof data === 'object' ? data.userInfo : null;

    console.log('🔵 User joined:', userId, 'with info:', userInfo, 'My socket ID:', socketRef.current?.id);

    // Don't create connection to ourselves
    if (userId === socketRef.current?.id) {
      console.log('🔵 Ignoring self connection');
      return;
    }

    // Store user info if provided
    if (userInfo) {
      setParticipantInfo(prev => ({
        ...prev,
        [userId]: userInfo
      }));
    }

    // Create new peer connection for the user with production-ready STUN servers
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Additional reliable STUN servers for production
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.nextcloud.com:443' }
      ]
    });

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔵 Connection state changed:', peerConnection.connectionState, 'for user:', userId);
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🔵 Received remote track from:', userId);
      const [remoteStream] = event.streams;
      console.log('🔵 Remote stream tracks:', remoteStream.getTracks().length);
      console.log('🔵 Remote stream tracks details:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

      setRemoteStreams(prev => {
        console.log('🔵 Setting remote stream for:', userId);
        return {
          ...prev,
          [userId]: remoteStream
        };
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🔵 Sending ICE candidate to:', userId);
        const socket = socketRef.current;
        socket?.emit('ice-candidate', { to: userId, candidate: event.candidate });
      }
    };

    // Add local tracks to the connection
    if (localStream) {
      console.log('🔵 Adding local tracks to peer connection for:', userId);
      localStream.getTracks().forEach(track => {
        console.log('🔵 Adding track:', track.kind, track.enabled);
        peerConnection.addTrack(track, localStream);
      });
    }

    setPeerConnections(prev => ({
      ...prev,
      [userId]: peerConnection
    }));

    setParticipants(prev => {
      if (!prev.includes(userId)) {
        return [...prev, userId];
      }
      return prev;
    });

    // Create and send offer to the new user
    try {
      console.log('🔵 Creating offer for:', userId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const socket = socketRef.current;
      socket?.emit('offer', { to: userId, offer });
      console.log('🔵 Sent offer to:', userId);
    } catch (error) {
      console.error('🔴 Error creating offer:', error);
    }
  }, [localStream]);

  const handleUserLeft = useCallback((userId: string) => {
    console.log('🔴 User left:', userId);

    // Clean up peer connection
    if (peerConnections[userId]) {
      console.log('🔴 Closing peer connection for:', userId);
      peerConnections[userId].close();
      setPeerConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[userId];
        return newConnections;
      });
    }

    // Clean up remote stream
    setRemoteStreams(prev => {
      const stream = prev[userId];
      if (stream) {
        console.log('🔴 Stopping remote stream tracks for:', userId);
        // Stop all tracks in the remote stream
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🔴 Stopped track:', track.kind, 'for user:', userId);
        });
      }
      const newStreams = { ...prev };
      delete newStreams[userId];
      console.log('🔴 Removed remote stream for:', userId);
      return newStreams;
    });

    // Clean up pending candidates
    setPendingCandidates(prev => {
      const newPending = { ...prev };
      delete newPending[userId];
      return newPending;
    });

    setParticipants(prev => {
      const newParticipants = prev.filter(id => id !== userId);
      console.log('🔴 Updated participants list. Removed:', userId, 'Remaining:', newParticipants);
      return newParticipants;
    });
  }, [peerConnections]);

  const handleOffer = useCallback(async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
    console.log('🟢 Received offer from:', from);

    // If we don't have a peer connection for this user, create one
    if (!peerConnections[from]) {
      console.log('🟢 No peer connection exists, creating one for:', from);
      await handleUserJoined(from);
    }

    const peerConnection = peerConnections[from];
    if (!peerConnection) {
      console.error('🔴 Still no peer connection for:', from);
      return;
    }

    try {
      console.log('🟢 Setting remote description for:', from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any pending ICE candidates
      const pending = pendingCandidates[from];
      if (pending && pending.length > 0) {
        console.log('🟠 Processing', pending.length, 'pending ICE candidates for:', from);
        for (const candidate of pending) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('🔴 Error adding pending ICE candidate:', error);
          }
        }
        // Clear pending candidates
        setPendingCandidates(prev => {
          const newPending = { ...prev };
          delete newPending[from];
          return newPending;
        });
      }

      console.log('🟢 Creating answer for:', from);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const socket = socketRef.current;
      socket?.emit('answer', { to: from, answer });
      console.log('🟢 Sent answer to:', from);
    } catch (error) {
      console.error('🔴 Error handling offer from:', from, error);
    }
  }, [peerConnections, handleUserJoined]);

  const handleAnswer = useCallback(async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
    console.log('🟡 Received answer from:', from);
    const peerConnection = peerConnections[from];
    if (!peerConnection) {
      console.error('🔴 No peer connection for answer from:', from);
      return;
    }

    try {
      console.log('🟡 Setting remote description (answer) for:', from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Process any pending ICE candidates
      const pending = pendingCandidates[from];
      if (pending && pending.length > 0) {
        console.log('🟠 Processing', pending.length, 'pending ICE candidates for:', from);
        for (const candidate of pending) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('🔴 Error adding pending ICE candidate:', error);
          }
        }
        // Clear pending candidates
        setPendingCandidates(prev => {
          const newPending = { ...prev };
          delete newPending[from];
          return newPending;
        });
      }

      console.log('🟡 Successfully set remote description for:', from);
    } catch (error) {
      console.error('🔴 Error handling answer from:', from, error);
    }
  }, [peerConnections]);

  const handleIceCandidate = useCallback(({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
    console.log('🟠 Received ICE candidate from:', from);

    // Always queue ICE candidates first, then process them
    setPendingCandidates(prev => ({
      ...prev,
      [from]: [...(prev[from] || []), candidate]
    }));

    const peerConnection = peerConnections[from];
    if (!peerConnection) {
      console.log('🟠 No peer connection yet for ICE candidate from:', from, '- queued for later');
      return;
    }

    // Check if remote description is set before adding ICE candidate
    if (!peerConnection.remoteDescription) {
      console.log('🟠 Remote description not set yet, ICE candidate queued for:', from);
      return;
    }

    // Process this candidate and any pending ones
    const pendingForUser = pendingCandidates[from] || [];
    if (pendingForUser.length > 0) {
      console.log('🟠 Processing', pendingForUser.length, 'pending ICE candidates for:', from);
      pendingForUser.forEach(async (pendingCandidate) => {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(pendingCandidate));
          console.log('🟠 Successfully added pending ICE candidate for:', from);
        } catch (error) {
          console.error('🔴 Error adding pending ICE candidate for:', from, error);
        }
      });

      // Clear pending candidates for this user
      setPendingCandidates(prev => {
        const newPending = { ...prev };
        delete newPending[from];
        return newPending;
      });
    }
  }, [peerConnections, pendingCandidates]);

  useEffect(() => {
    recordingServiceRef.current = new RecordingService();
    return () => {
      recordingServiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Mobile-friendly constraints
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const constraints = {
          video: isMobile ? {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            frameRate: { min: 10, ideal: 15, max: 30 },
            facingMode: 'user'
          } : {
            width: { min: 640, ideal: 1024, max: 1920 },
            height: { min: 480, ideal: 576, max: 1080 },
            frameRate: { min: 15, ideal: 24, max: 30 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: isMobile ? 16000 : 44100
          }
        };

        console.log('🎥 Requesting media with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Set initial track states
        stream.getVideoTracks().forEach(track => {
          track.enabled = true;
          console.log('🎥 Video track settings:', track.getSettings());
        });
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
          console.log('🎤 Audio track settings:', track.getSettings());
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        console.log('🎥 Media initialized successfully');
      } catch (error) {
        console.error('Error accessing media devices:', error);

        // Try fallback constraints for mobile
        try {
          console.log('🎥 Trying fallback constraints...');
          const fallbackConstraints = {
            video: { facingMode: 'user' },
            audio: true
          };

          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          console.log('🎥 Fallback media initialized');
        } catch (fallbackError) {
          console.error('Fallback media access failed:', fallbackError);
          setIsVideoOff(true);
          setIsMuted(true);
        }
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
        // Only create socket if we don't have one
        if (!socketRef.current || socketRef.current.disconnected) {
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
        }
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    setupSocket();

    return () => {
      console.log('Cleaning up socket connection...');
      // Don't disconnect socket here as it might be reused
      // Only disconnect when component is truly unmounting
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    console.log('🔵 FRONTEND: Setting up socket connection, peerId:', peerId, 'socket exists:', !!socket);

    if (socket) {
      socket.on('connect', () => {
        console.log('🔵 FRONTEND: Socket connected successfully, socket ID:', socket.id);
        console.log('🔵 FRONTEND: Joining room with peerId:', peerId);
        setSocketReady(true);

        // Add a small delay to ensure connection is stable
        setTimeout(() => {
          console.log('🔵 FRONTEND: About to emit join-room event');
          const userInfo = {
            name: user?.user_metadata?.full_name || user?.email || 'Anonymous User',
            email: user?.email || '',
            avatar: user?.user_metadata?.avatar_url || ''
          };
          socket.emit('join-room', { roomId: peerId, userInfo });
          console.log('🔵 FRONTEND: join-room event emitted with roomId:', peerId, 'and userInfo:', userInfo);
        }, 100);
      });

      socket.on('disconnect', () => {
        if (!isEndingRef.current) {
          console.log('🔴 FRONTEND: Socket disconnected');
          setSocketReady(false);
        }
      });

      if (!socket.connected) {
        console.log('🔵 FRONTEND: Socket not connected, attempting to connect...');
        socket.connect();
      } else {
        console.log('🔵 FRONTEND: Socket already connected, socket ID:', socket.id);
        console.log('🔵 FRONTEND: Joining room with peerId:', peerId);
        setSocketReady(true);

        setTimeout(() => {
          console.log('🔵 FRONTEND: About to emit join-room event (already connected)');
          const userInfo = {
            name: user?.user_metadata?.full_name || user?.email || 'Anonymous User',
            email: user?.email || '',
            avatar: user?.user_metadata?.avatar_url || ''
          };
          socket.emit('join-room', { roomId: peerId, userInfo });
          console.log('🔵 FRONTEND: join-room event emitted (already connected) with roomId:', peerId, 'and userInfo:', userInfo);
        }, 100);
      }

      return () => {
        console.log('🔵 FRONTEND: Cleaning up socket listeners');
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
    if (socketReady && !transcriptionService) {
      const socket = socketRef.current;
      console.log('🔵 FRONTEND: Socket is ready, setting up transcription service');

      // Initialize transcription service only if we don't have one
      console.log('🎤 Initializing transcription service for room:', peerId);
      const service = new TranscriptionService(socket!, peerId);
      setTranscriptionService(service);

      // Start transcription automatically
      console.log('🎤 Starting transcription service');
      service.start().then(startResult => {
        if (startResult.success) {
          setIsTranscribing(true);
          console.log('🎤 Transcription started successfully');
        } else {
          console.error('🎤 Failed to start transcription:', startResult.error || 'Unknown error');
        }
      }).catch(error => {
        console.error('🎤 Error starting transcription service:', error);
      });

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
        console.log('🎤 Cleaning up transcription service');
        if (service) {
          service.stop();
        }
        socket?.off('transcription');
        socket?.off('transcription-error');
      };
    }
  }, [socketReady, peerId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !localStream) return;

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [localStream, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIceCandidate, socketRef.current]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleChatMessage = (data: { content: string; sender: string; senderEmail: string }) => {
      console.log('Received chat message:', data);
      // Only show messages from other users
      if (data.senderEmail !== user?.email) {
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
  }, [user?.email, socketRef.current]);

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

    console.log('🔴 FRONTEND: Ending call...');

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
        console.log('🔴 FRONTEND: Stopping local media tracks');
        localStream.getTracks().forEach(track => track.stop());
      }

      // Close all peer connections
      console.log('🔴 FRONTEND: Closing peer connections');
      Object.values(peerConnections).forEach(pc => pc.close());
      setPeerConnections({});

      // Notify other participants that we're leaving
      const socket = socketRef.current;
      if (socket && socket.connected) {
        console.log('🔴 FRONTEND: Notifying others that we are leaving');
        socket.emit('user-leaving', { roomId: peerId });
      }

      // Clean up socket connection
      if (socket) {
        socket.disconnect();
      }

      // Try to end meeting on server (optional - don't fail if it doesn't work)
      if (peerId) {
        try {
          console.log('🔴 FRONTEND: Attempting to end meeting on server');
          const response = await fetch(`/api/meetings/${peerId}/end`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('🔴 FRONTEND: Meeting ended successfully on server:', data);
          } else {
            console.log('🔴 FRONTEND: Could not end meeting on server, but continuing with local cleanup');
          }
        } catch (error) {
          console.log('🔴 FRONTEND: Could not end meeting on server, but continuing with local cleanup:', error);
        }
      }

      console.log('🔴 FRONTEND: Navigating to dashboard');
      router.push('/dashboard');
    } catch (error) {
      console.error('🔴 FRONTEND: Error ending meeting:', error);
      // Even if there's an error, try to navigate away
      router.push('/dashboard');
    }

    // Always reset the flag
    isEndingRef.current = false;
  };

  const handleToggleTranscription = async () => {
    if (transcriptionService) {
      if (isTranscribing) {
        console.log('🎤 Stopping transcription');
        await transcriptionService.stop();
        setIsTranscribing(false);
      } else {
        console.log('🎤 Starting transcription');
        const result = await transcriptionService.start();
        if (result.success) {
          setIsTranscribing(true);
        } else {
          console.error('🎤 Failed to start transcription:', result.error);
        }
      }
    } else {
      console.warn('🎤 Transcription service not available');
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
    const socket = socketRef.current;
    if (socket && socket.connected) {
      const senderName = user?.user_metadata?.full_name || user?.email || 'Anonymous';
      const messageData = {
        roomId: peerId,
        content,
        sender: senderName,
        senderEmail: user?.email,
        timestamp: new Date().toISOString()
      };

      console.log('Emitting chat message:', messageData);
      socket.emit('chat-message', messageData);

      setMessages(prev => [...prev, {
        content,
        sender: senderName,
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
      {/* Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-black rounded-2xl overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 dark:opacity-30" />

        {/* Ambient Lighting Effects */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-6 pb-24 transition-all duration-300 ${getGridSize(participants.length + 1, showChat)}`}
        >
          <div className={`h-full grid ${getGridLayout(participants.length + 1, showChat)} gap-6 auto-rows-fr`}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`relative ${getVideoAspect(participants.length + 1)} rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black shadow-2xl border border-gray-300 dark:border-gray-700/50`}
            >
              <div className={`relative w-full h-full rounded-lg overflow-hidden ${isVideoOff ? 'bg-gray-900' : ''}`}>
                {isVideoOff ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 relative rounded-full overflow-hidden ring-4 ring-indigo-500/30">
                        {user?.user_metadata?.avatar_url ? (
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt={user?.user_metadata?.full_name || 'User'}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-500 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-white">
                              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm font-medium">
                        Camera is turned off
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {user?.user_metadata?.full_name || user?.email || 'User'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: isVideoOff ? 'scaleX(0)' : 'scaleX(1)',
                      transition: 'transform 0.3s ease',
                      // Mobile optimizations
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    className="rounded-lg"
                  />
                )}
              </div>
            </motion.div>
            
            <AnimatePresence mode="popLayout">
              {participants.map((participantId, index) => {
                const stream = remoteStreams[participantId];
                const userInfo = participantInfo[participantId];
                console.log('🔵 Rendering participant:', participantId, 'has stream:', !!stream, 'stream tracks:', stream?.getTracks().length || 0, 'userInfo:', userInfo);

                return (
                  <motion.div
                    key={participantId}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                    className={`relative ${getVideoAspect(participants.length + 1)} rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black shadow-2xl border border-gray-300 dark:border-gray-700/50 hover:border-blue-500/50 transition-all duration-300`}
                  >
                    <ParticipantVideo
                      participantId={participantId}
                      layout="grid"
                      stream={stream}
                      isLocal={false}
                      isVideoOff={!stream}
                      profileImage={userInfo?.avatar}
                      participantName={userInfo?.name}
                      participantEmail={userInfo?.email}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-6 top-6 bottom-28 w-80 xl:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-300/50 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden z-40"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl" />
              <div className="relative z-10 h-full">
                <ChatSystem
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  transcripts={transcripts}
                  transcriptText={transcriptText}
                  summary={summary}
                  isSummarizing={isSummarizing}
                  onRequestSummary={generateSummary}
                />
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

        {/* Enhanced Controls Bar */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-4 left-4 right-4 z-30"
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
            onToggleRecording={isRecording ? handleStopRecording : handleStartRecording}
            isRecording={isRecording}
            onToggleWhiteboard={handleToggleWhiteboard}
            showWhiteboard={showWhiteboard}
            onToggleChat={() => setShowChat(!showChat)}
            showChat={showChat}
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