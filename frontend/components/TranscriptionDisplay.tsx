'use client';
import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';

interface TranscriptionDisplayProps {
  socket: Socket;
  roomId: string;
  onTranscriptComplete?: (transcripts: string[]) => void;
}

export default function TranscriptionDisplay({ 
  socket, 
  roomId,
  onTranscriptComplete 
}: TranscriptionDisplayProps) {
  const [transcripts, setTranscripts] = useState<Array<{
    text: string;
    timestamp: number;
    speaker: string;
  }>>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('transcription', (data) => {
      setTranscripts(prev => {
        const newTranscripts = [...prev, {
          text: data.transcript,
          timestamp: data.timestamp,
          speaker: data.speaker
        }];
        
        // Pass complete transcripts to parent
        if (onTranscriptComplete) {
          onTranscriptComplete(newTranscripts.map(t => t.text));
        }
        
        return newTranscripts;
      });
    });

    return () => {
      socket.off('transcription');
    };
  }, [socket, onTranscriptComplete]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <motion.div 
      className="fixed left-4 bottom-24 w-96 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4 border-b border-white/20">
        <h3 className="text-white font-semibold">Live Transcription</h3>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-2">
        {transcripts.map((transcript, index) => (
          <div key={index} className="text-white/90">
            <span className="text-xs text-white/60">
              {new Date(transcript.timestamp).toLocaleTimeString()}
            </span>
            <p data-transcript>{transcript.text}</p>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>
    </motion.div>
  );
} 