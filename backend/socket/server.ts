import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

export { io, httpServer }; 