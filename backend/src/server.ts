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

// Configure CORS
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

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

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Frontend URL: ${frontendUrl}`);
});