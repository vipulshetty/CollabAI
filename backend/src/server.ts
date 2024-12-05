import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Room and message state management
interface Message {
  text: string;
  sender: string;
  timestamp: number;
}

const rooms = new Map<string, Set<string>>();
const roomMessages = new Map<string, Message[]>();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId }) => {
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      roomMessages.set(roomId, []);
    }
    
    rooms.get(roomId)?.add(socket.id);
    socket.join(roomId);

    // Send existing messages to the new participant
    const messages = roomMessages.get(roomId) || [];
    socket.emit('chat-history', messages);

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', ({ roomId, message }) => {
    const newMessage = {
      text: message,
      sender: socket.id,
      timestamp: Date.now()
    };

    // Store message in room history
    const messages = roomMessages.get(roomId) || [];
    messages.push(newMessage);
    roomMessages.set(roomId, messages);

    // Broadcast message to room
    socket.to(roomId).emit('chat-message', newMessage);
    console.log(`Message sent in room ${roomId}:`, newMessage);
  });

  socket.on('disconnect', () => {
    // Clean up user from rooms
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
          roomMessages.delete(roomId);
        }
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
io.engine.on('connection_error', (err) => {
  console.error('Connection error:', err);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
  console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
}); 