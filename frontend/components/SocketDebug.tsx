'use client';
import { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import SocketDebug from './SocketDebug';

export default function SocketDebug() {
  const [status, setStatus] = useState({
    connected: false,
    socketExists: false
  });

  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      setStatus({
        connected: socket.connected,
        socketExists: true
      });

      socket.on('connect', () => {
        setStatus(prev => ({ ...prev, connected: true }));
      });

      socket.on('disconnect', () => {
        setStatus(prev => ({ ...prev, connected: false }));
      });
    }
  }, []);

  return (
    <div className="fixed top-4 left-4 bg-black/50 text-white p-2 rounded-lg text-sm">
      Socket: {status.socketExists ? '✅' : '❌'} | 
      Connected: {status.connected ? '✅' : '❌'}
    </div>
  );
} 