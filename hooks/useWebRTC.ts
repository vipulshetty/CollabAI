import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';

interface WebRTCHook {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  startCall: (roomId: string) => void;
  endCall: () => void;
}

export function useWebRTC(socket: Socket): WebRTCHook {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map());

  useEffect(() => {
    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }

    initLocalStream();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peersRef.current.forEach(peer => peer.destroy());
    };
  }, []);

  const startCall = (roomId: string) => {
    if (!localStream) return;

    socket.emit('join-room', { roomId });

    socket.on('user-joined', (userId: string) => {
      const peer = createPeer(userId, localStream);
      peersRef.current.set(userId, peer);
    });

    socket.on('receive-signal', ({ userId, signalData }) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.signal(signalData);
      }
    });
  };

  const endCall = () => {
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();
    setRemoteStreams([]);
  };

  const createPeer = (userId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on('signal', (signalData) => {
      socket.emit('send-signal', { userId, signalData });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStreams(prev => [...prev, remoteStream]);
    });

    return peer;
  };

  return { localStream, remoteStreams, startCall, endCall };
}