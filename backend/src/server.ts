import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Load environment variables
config();

// Type guard for environment variables
function assertEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// Get and validate environment variables
const supabaseUrl = assertEnvVar(process.env.SUPABASE_URL, 'SUPABASE_URL');
const supabaseKey = assertEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const port = process.env.PORT || 3001;

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Add Supabase to request object
declare global {
  namespace Express {
    interface Request {
      supabase: SupabaseClient;
    }
  }
}

// Configure CORS for production
const allowedOrigins = [
  frontendUrl,
  'http://localhost:3000', // Development
  'http://localhost:3002', // Development alternative port
  process.env.CORS_ORIGIN, // Additional production origin
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow any localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'collab-ai-backend',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Add Supabase to request
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.supabase = supabase;
  next();
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize Socket.IO with production-ready CORS
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow any localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Production optimizations
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('🔵 BACKEND: Client connected:', socket.id);

  // Track which rooms this socket is in
  let currentRooms: string[] = [];

  // Add debugging for all events
  socket.onAny((eventName, ...args) => {
    console.log(`🔵 BACKEND: Received event "${eventName}" from ${socket.id}:`, args);
  });

  // Handle room joining
  socket.on('join-room', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    currentRooms.push(roomId);
    console.log(`🔵 Socket ${socket.id} joined room ${roomId}`);
    console.log(`🔵 Notifying room ${roomId} that ${socket.id} joined`);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  // Handle user leaving gracefully
  socket.on('user-leaving', (data) => {
    const { roomId } = data;
    console.log(`🔴 BACKEND: User ${socket.id} leaving room ${roomId}`);
    socket.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);
    currentRooms = currentRooms.filter(room => room !== roomId);
  });

  // WebRTC signaling events
  socket.on('offer', (data) => {
    const { to, offer } = data;
    console.log(`🟢 BACKEND: Received offer from ${socket.id} to ${to}`);
    console.log(`🟢 BACKEND: Relaying offer to socket ${to}`);
    // Use io.to() to send to specific socket ID
    io.to(to).emit('offer', { from: socket.id, offer });
    console.log(`🟢 BACKEND: Offer sent to ${to}`);
  });

  socket.on('answer', (data) => {
    const { to, answer } = data;
    console.log(`🟡 BACKEND: Received answer from ${socket.id} to ${to}`);
    console.log(`🟡 BACKEND: Relaying answer to socket ${to}`);
    // Use io.to() to send to specific socket ID
    io.to(to).emit('answer', { from: socket.id, answer });
    console.log(`🟡 BACKEND: Answer sent to ${to}`);
  });

  socket.on('ice-candidate', (data) => {
    const { to, candidate } = data;
    console.log(`🟠 BACKEND: Received ICE candidate from ${socket.id} to ${to}`);
    // Use io.to() to send to specific socket ID
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    const { roomId, content, sender, senderEmail, timestamp } = data;
    console.log(`Chat message in room ${roomId} from ${sender}: ${content}`);
    socket.to(roomId).emit('chat-message', {
      content,
      sender,
      senderEmail,
      timestamp
    });
  });

  // Handle transcription events
  socket.on('transcription', (data) => {
    const { roomId, transcript, speaker, timestamp } = data;
    console.log('Received transcription:', { roomId, transcript, speaker });

    // Broadcast transcription to all users in the room
    socket.to(roomId).emit('transcription', {
      transcript,
      speaker: speaker || 'Unknown',
      timestamp: timestamp || new Date().toISOString(),
      socketId: socket.id
    });

    // Save transcription to database
    saveTranscription(roomId, transcript, speaker || 'Unknown', timestamp || new Date().toISOString());
  });

  // Handle transcription status updates
  socket.on('transcription-status', (data) => {
    const { roomId, status } = data;
    console.log(`Transcription ${status} for room ${roomId}`);
    socket.to(roomId).emit('transcription-status', { status, socketId: socket.id });
  });

  // Handle meeting events
  socket.on('meeting-started', (data) => {
    const { roomId, meetingId } = data;
    console.log(`Meeting started: ${meetingId} in room ${roomId}`);
    socket.to(roomId).emit('meeting-started', { meetingId, socketId: socket.id });
  });

  socket.on('meeting-ended', (data) => {
    const { roomId, meetingId } = data;
    console.log(`Meeting ended: ${meetingId} in room ${roomId}`);
    socket.to(roomId).emit('meeting-ended', { meetingId, socketId: socket.id });
  });

  // Handle calendar events
  socket.on('calendar-event-added', (event) => {
    console.log('Calendar event added:', event);
    socket.broadcast.emit('calendar-event-added', event);
  });

  // Handle notifications
  socket.on('send-notification', (notification) => {
    console.log('Sending notification:', notification);
    if (notification.participants) {
      notification.participants.forEach((participantId: string) => {
        socket.broadcast.emit('notification', {
          ...notification,
          targetUser: participantId
        });
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 BACKEND: Client disconnected:', socket.id, 'Reason:', reason);

    // Notify all rooms that this user has disconnected
    currentRooms.forEach(roomId => {
      console.log(`🔴 BACKEND: Notifying room ${roomId} that ${socket.id} disconnected`);
      socket.to(roomId).emit('user-left', socket.id);
      socket.to(roomId).emit('user-disconnected', socket.id);
    });

    // Clear the rooms array
    currentRooms = [];
  });
});

// Function to save transcription to database
async function saveTranscription(roomId: string, content: string, speaker: string, timestamp: string) {
  try {
    const { error } = await supabase
      .from('meeting_transcripts')
      .insert({
        meeting_id: roomId,
        content,
        speaker,
        timestamp: new Date(timestamp).toISOString()
      });

    if (error) {
      console.error('Error saving transcription:', error);
    } else {
      console.log('Transcription saved successfully');
    }
  } catch (error) {
    console.error('Exception saving transcription:', error);
  }
}

// Start server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Frontend URL: ${frontendUrl}`);
});