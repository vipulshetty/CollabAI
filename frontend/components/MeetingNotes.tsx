'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { Edit3 } from 'lucide-react';

interface MeetingNotesProps {
  socket: Socket | null;
  roomId: string;
}

export default function MeetingNotes({ socket, roomId }: MeetingNotesProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('notes-update', (updatedNotes: string) => {
      setNotes(updatedNotes);
    });

    return () => {
      socket.off('notes-update');
    };
  }, [socket]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedNotes = e.target.value;
    setNotes(updatedNotes);
    if (socket) {
      socket.emit('update-notes', { roomId, notes: updatedNotes });
    }
  };

  return (
    <motion.div 
      className="fixed right-4 top-24 w-96 bg-white rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Edit3 size={20} />
          Meeting Notes
        </h3>
      </div>
      <div className="p-4">
        <motion.textarea
          value={notes}
          onChange={handleNotesChange}
          className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Collaborative notes..."
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      </div>
    </motion.div>
  );
}
