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
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-300/50 dark:border-gray-600/50 rounded-t-2xl">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Chat & Transcripts</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20 dark:bg-gray-900/20">
        {messages.map((message, index) => (
          <motion.div
            key={`${message.content}-${message.sender}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              message.isLocal ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-lg ${
                message.isLocal
                  ? 'bg-blue-600/90 text-white backdrop-blur-sm border border-blue-500/50'
                  : 'bg-gray-200 dark:bg-gray-700/90 text-gray-900 dark:text-white backdrop-blur-sm border border-gray-300 dark:border-gray-600/50'
              }`}
            >
              <p className="break-words">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {message.sender}
              </span>
            </div>
          </motion.div>
        ))}

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
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300/50 dark:border-gray-600/50 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-b-2xl">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white rounded-xl border border-gray-300/50 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-200"
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-blue-600/90 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm border border-blue-500/50"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}