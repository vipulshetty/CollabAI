'use client';
import { useState } from 'react';
import { Socket } from 'socket.io-client';

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

  const createPoll = () => {
    if (!socket || !newPoll.question.trim()) return;
    const poll = { ...newPoll, votes: new Array(newPoll.options.length).fill(0) };
    socket.emit('create-poll', { roomId, poll });
    setPolls(prev => [...prev, poll]);
    setNewPoll({ question: '', options: ['', ''] });
  };

  const vote = (pollIndex: number, optionIndex: number) => {
    if (!socket) return;
    const updatedPolls = [...polls];
    updatedPolls[pollIndex].votes[optionIndex]++;
    setPolls(updatedPolls);
    socket.emit('vote', { roomId, pollIndex, optionIndex });
  };

  return (
    <div className="fixed right-4 bottom-24 w-80 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Meeting Polls</h3>
      </div>
      <div className="p-4 space-y-4">
        {polls.map((poll, i) => (
          <div key={i} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium">{poll.question}</h4>
            {poll.options.map((option, j) => (
              <button
                key={j}
                onClick={() => vote(i, j)}
                className="block w-full text-left px-3 py-2 mt-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                {option} ({poll.votes[j]})
              </button>
            ))}
          </div>
        ))}
        <div className="p-3 bg-gray-50 rounded-lg">
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
          <button
            onClick={createPoll}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Poll
          </button>
        </div>
      </div>
    </div>
  );
} 