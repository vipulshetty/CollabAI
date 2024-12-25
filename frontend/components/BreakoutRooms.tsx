'use client';
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Room {
  id: string;
  name: string;
  participants: string[];
}

interface BreakoutRoomsProps {
  socket: Socket | null;
  mainRoomId: string;
}

export default function BreakoutRooms({ socket, mainRoomId }: BreakoutRoomsProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('breakout-room-created', (room: Room) => {
      setRooms(prev => [...prev, room]);
    });

    socket.on('participant-joined-room', ({ roomId, userId }) => {
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, participants: [...room.participants, userId] }
          : room
      ));
    });

    return () => {
      socket.off('breakout-room-created');
      socket.off('participant-joined-room');
    };
  }, [socket]);

  const createBreakoutRoom = () => {
    if (!socket || !newRoomName.trim()) return;

    socket.emit('create-breakout-room', {
      mainRoomId,
      name: newRoomName
    });
    setShowRoomModal(false);
    setNewRoomName('');
  };

  const joinBreakoutRoom = (roomId: string) => {
    if (!socket) return;
    socket.emit('join-breakout-room', { roomId, mainRoomId });
  };

  return (
    <div className="fixed left-4 top-24 w-64 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Breakout Rooms</h3>
          <button
            onClick={() => setShowRoomModal(true)}
            className="text-blue-500 hover:text-blue-600"
          >
            + New Room
          </button>
        </div>
      </div>

      <div className="p-4">
        {rooms.map(room => (
          <div key={room.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">{room.name}</h4>
              <button
                onClick={() => joinBreakoutRoom(room.id)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Join
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {room.participants.length} participants
            </p>
          </div>
        ))}
      </div>

      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create Breakout Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room Name"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRoomModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createBreakoutRoom}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 