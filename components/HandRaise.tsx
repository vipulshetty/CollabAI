'use client';
import { useState } from 'react';
import { Socket } from 'socket.io-client';

interface HandRaiseProps {
  socket: Socket | null;
  roomId: string;
}

export default function HandRaise({ socket, roomId }: HandRaiseProps) {
  const [handRaised, setHandRaised] = useState(false);

  const toggleHandRaise = () => {
    if (!socket) return;
    setHandRaised(!handRaised);
    socket.emit('hand-raise', { roomId, handRaised: !handRaised });
  };

  return (
    <button
      onClick={toggleHandRaise}
      className={`p-4 rounded-full transition-colors ${
        handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      ✋ {handRaised ? 'Lower Hand' : 'Raise Hand'}
    </button>
  );
} 