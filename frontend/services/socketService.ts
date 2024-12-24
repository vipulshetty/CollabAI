import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  initSocket() {
    if (!this.socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (!socketUrl) {
        console.error('Socket URL not configured');
        return null;
      }

      console.log('Connecting to socket server:', socketUrl);

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: true,
        forceNew: true,
        auth: {
          token: typeof window !== 'undefined' ? localStorage.getItem('session') : null
        }
      });
      
      this.setupEventListeners();
    }
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleConnectionError();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleConnectionError();
    });
  }

  private handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      this.reconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.disconnect();
    }
  }

  private reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      if (this.socket) {
        this.socket.connect();
      } else {
        this.initSocket();
      }
    }, 1000 * Math.min(this.reconnectAttempts + 1, 5)); // Exponential backoff capped at 5 seconds
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Emit event with retry logic
  emit(event: string, data: any, callback?: (response: any) => void) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, attempting to reconnect...');
      this.reconnect();
      return false;
    }

    try {
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
      return true;
    } catch (error) {
      console.error('Error emitting event:', error);
      return false;
    }
  }

  // Add event listener
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.removeAllListeners(event);
    }
  }

  getSocket() {
    return this.socket || this.initSocket();
  }
}

// Create a singleton instance
export const socketService = new SocketService();