'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MeetingSummary from './MeetingSummary';
import { socketService } from '../services/socketService';
import TranscriptionDisplay from './TranscriptionDisplay';

interface MeetingInfoProps {
  roomId: string;
  transcripts: string[];
}

export default function MeetingInfo({ roomId, transcripts: initialTranscripts }: MeetingInfoProps) {
  const socket = socketService.getSocket();
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);

  const handleTranscriptComplete = (transcripts: string[]) => {
    setSavedTranscripts(transcripts);
  };

  return (
    <div className="fixed right-4 top-24 flex flex-col gap-4">
      <motion.div 
        className="w-96 bg-white rounded-lg shadow-lg overflow-hidden"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MeetingSummary socket={socket} roomId={roomId} hideWaiting />
      </motion.div>
      <TranscriptionDisplay 
        socket={socket} 
        roomId={roomId} 
        onTranscriptComplete={handleTranscriptComplete}
      />
    </div>
  );
}