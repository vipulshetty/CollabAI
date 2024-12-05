'use client';
import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Paperclip, MessageSquare } from 'lucide-react';
import { socketService } from '@/services/socketService';

interface ChatSystemProps {
  socket: Socket;
  roomId: string;
  onClose: () => void;
  minimized: boolean;
  onMinimize: () => void;
  username?: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
}

export default function ChatSystem({ 
  socket, 
  roomId, 
  onClose, 
  minimized, 
  onMinimize,
  username = 'You'
}: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = () => {
    socket.emit('typing', { roomId, username });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId, username });
    }, 2000);
  };

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-chat', { roomId });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTyping = (data: { username: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
        return prev;
      });

      // Emit typing event
      socket.emit('typing', { roomId, username });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { roomId, username });
      }, 2000);
    };

    const handleStopTyping = (data: { username: string }) => {
      setTypingUsers(prev => prev.filter(user => user !== data.username));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('chat-message', handleMessage);
    socket.on('user-typing', handleTyping);
    socket.on('user-stop-typing', handleStopTyping);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('chat-message', handleMessage);
      socket.off('user-typing', handleTyping);
      socket.off('user-stop-typing', handleStopTyping);
    };
  }, [socket, roomId, username]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: username,
      timestamp: Date.now(),
      type: 'text'
    };

    socket.emit('send-message', { roomId, message });
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const { fileUrl } = await response.json();

      const message: Message = {
        id: Date.now().toString(),
        text: file.name,
        sender: username,
        timestamp: Date.now(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl
      };

      socket.emit('send-message', { roomId, message });
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  useEffect(() => {
    const socket = socketService.getSocket();
    console.log('Socket status:', socket?.connected);
  }, []);

  if (minimized) {
    return (
      <motion.div 
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full cursor-pointer shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onMinimize}
      >
        <div className="relative">
          <MessageSquare size={24} />
          {messages.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="w-80 bg-[#1a1b1e] rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col h-[500px]">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#2d2e32]">
          <h2 className="text-lg font-semibold text-white">Chat</h2>
          <button 
            onClick={onMinimize}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Minimize2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender === username}
            />
          ))}
          {typingUsers.length > 0 && (
            <div className="text-gray-400 text-sm">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700 bg-[#2d2e32]">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
        }`}
      >
        {!isOwn && (
          <div className="text-sm font-medium mb-1">{message.sender}</div>
        )}
        
        {message.type === 'text' && (
          <p className="text-sm">{message.text}</p>
        )}
        
        {message.type === 'image' && message.fileUrl && (
          <img 
            src={message.fileUrl} 
            alt={message.text}
            className="max-w-full rounded-lg"
          />
        )}
        
        {message.type === 'file' && message.fileUrl && (
          <a 
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-blue-100"
          >
            <Paperclip size={16} />
            {message.text}
          </a>
        )}

        <div className="mt-1">
          <span className="text-xs opacity-75">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
} 