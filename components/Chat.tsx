'use client';
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ChatProps {
  socket: Socket | null;
  roomId: string;
}

export default function Chat({ socket, roomId }: ChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Set up socket listener
    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Cleanup listener on unmount
    return () => {
      socket.off('receive-message');
    };
  }, [socket]);

  const sendMessage = () => {
    if (!socket || !message.trim()) return;
    
    socket.emit('send-message', { roomId, message });
    setMessage('');
  };

  return (
    <div className="fixed right-4 bottom-24 w-80 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chat</h3>
      </div>
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="bg-gray-100 rounded-lg p-2">
            {msg}
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message"
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button 
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}