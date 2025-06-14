import { io, Socket } from 'socket.io-client';
import { backendWakeupService } from './backendWakeupService';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  async initSocket() {
    if (this.isConnecting) {
      console.log('🔄 Socket connection already in progress...');
      return this.socket;
    }

    if (!this.socket || this.socket.disconnected) {
      this.isConnecting = true;

      // Wake up backend first if in production
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Ensuring backend is awake before connecting...');
        await backendWakeupService.ensureBackendAwake();
      }

      // Use production URL consistently
      const socketUrl = process.env.NODE_ENV === 'production'
        ? 'https://collabai.onrender.com'
        : 'http://localhost:3001';

      console.log('Connecting to socket server:', socketUrl);

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      // Production-ready socket configuration with better timeouts
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 2000, // Increased delay
        reconnectionDelayMax: 10000, // Increased max delay
        timeout: 30000, // Increased timeout for slow servers
        withCredentials: false,
        forceNew: false,
        // Additional production settings
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        // Polling settings for better reliability
        forceBase64: false,
        enablesXDR: false
      });

      this.setupEventListeners();
      this.isConnecting = false;
    }
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please check your connection.');
        this.disconnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  getSocket() {
    return this.socket || this.initSocket();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();