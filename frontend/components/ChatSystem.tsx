'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSystemProps {
  messages: Array<{ content: string; sender: string; isLocal: boolean }>;
  onSendMessage: (content: string) => void;
  transcripts: string[];
  transcriptText: string;
  summary: string;
  isSummarizing: boolean;
  onRequestSummary: () => void;
}

export default function ChatSystem({
  messages,
  onSendMessage,
  transcripts,
  transcriptText,
  summary,
  isSummarizing,
  onRequestSummary
}: ChatSystemProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('Messages prop updated:', messages);
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting message:', newMessage);
    if (newMessage.trim()) {
      console.log('Calling onSendMessage with:', newMessage.trim());
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">Chat & Transcripts</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((message, index) => {
          console.log('Rendering message:', message);
          return (
            <div
              key={index}
              className={`flex ${
                message.isLocal ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
                  message.isLocal
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <span className="text-xs opacity-75 mt-0.5 block">
                  {message.sender}
                </span>
              </div>
            </div>
          );
        })}

        {/* Transcripts */}
        {transcripts.length > 0 && (
          <div className="border-t border-gray-700 mt-4 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Transcripts</h4>
            {transcripts.map((transcript, index) => (
              <div key={index} className="text-sm text-gray-300 mb-2">
                {transcript}
              </div>
            ))}
          </div>
        )}

        {/* Live Transcript */}
        {transcriptText && (
          <div className="text-sm text-gray-400 italic">
            {transcriptText}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="border-t border-gray-700 mt-4 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Summary</h4>
            <p className="text-sm text-gray-300">{summary}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700">
        <div className="flex space-x-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-2 py-1.5 bg-gray-700 text-sm text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}