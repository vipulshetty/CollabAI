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

Now, let's update the MeetingPolls component:

```tsx file="components/MeetingPolls.tsx"
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { BarChart2, Plus, X } from 'lucide-react';

interface Poll {
  question: string;
  options: string[];
  votes: number[];
}

interface MeetingPollsProps {
  socket: Socket | null;
  roomId: string;
}

export default function MeetingPolls({ socket, roomId }: MeetingPollsProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [showNewPollForm, setShowNewPollForm] = useState(false);

  const createPoll = () => {
    if (!socket || !newPoll.question.trim()) return;
    const poll = { ...newPoll, votes: new Array(newPoll.options.length).fill(0) };
    socket.emit('create-poll', { roomId, poll });
    setPolls(prev => [...prev, poll]);
    setNewPoll({ question: '', options: ['', ''] });
    setShowNewPollForm(false);
  };

  const vote = (pollIndex: number, optionIndex: number) => {
    if (!socket) return;
    const updatedPolls = [...polls];
    updatedPolls[pollIndex].votes[optionIndex]++;
    setPolls(updatedPolls);
    socket.emit('vote', { roomId, pollIndex, optionIndex });
  };

  return (
    <motion.div 
      className="fixed right-4 bottom-24 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BarChart2 size={20} />
          Meeting Polls
        </h3>
        <motion.button
          onClick={() => setShowNewPollForm(!showNewPollForm)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {showNewPollForm ? <X size={20} /> : <Plus size={20} />}
        </motion.button>
      </div>
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {showNewPollForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-gray-50 rounded-lg overflow-hidden"
            >
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                placeholder="Poll Question"
                className="w-full px-3 py-2 border rounded-lg mb-2"
              />
              {newPoll.options.map((option, i) => (
                <input
                  key={i}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const options = [...newPoll.options];
                    options[i] = e.target.value;
                    setNewPoll({ ...newPoll, options });
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />
              ))}
              <motion.button
                onClick={createPoll}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Poll
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        {polls.map((poll, i) => (
          <motion.div 
            key={i} 
            className="mb-4 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <h4 className="font-medium mb-2">{poll.question}</h4>
            {poll.options.map((option, j) => (
              <motion.button
                key={j}
                onClick={() => vote(i, j)}
                className="block w-full text-left px-3 py-2 mt-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {option} ({poll.votes[j]})
              </motion.button>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

