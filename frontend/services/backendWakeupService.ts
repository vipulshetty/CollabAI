export class BackendWakeupService {
  private static instance: BackendWakeupService;
  private wakeupInterval: NodeJS.Timeout | null = null;
  private isWakingUp = false;

  private constructor() {}

  static getInstance(): BackendWakeupService {
    if (!BackendWakeupService.instance) {
      BackendWakeupService.instance = new BackendWakeupService();
    }
    return BackendWakeupService.instance;
  }

  async wakeupBackend(): Promise<boolean> {
    if (this.isWakingUp) {
      console.log('🔄 Backend wakeup already in progress...');
      return false;
    }

    this.isWakingUp = true;
    console.log('🚀 Waking up backend server...');

    try {
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://collabai.onrender.com' 
        : 'http://localhost:3001';

      // Try to ping the backend with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Backend server is awake and responding');
        this.isWakingUp = false;
        return true;
      } else {
        console.warn('⚠️ Backend responded but with error status:', response.status);
        this.isWakingUp = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to wake up backend:', error);
      this.isWakingUp = false;
      return false;
    }
  }

  startPeriodicWakeup(): void {
    // Wake up backend every 10 minutes to prevent sleeping
    if (this.wakeupInterval) {
      clearInterval(this.wakeupInterval);
    }

    this.wakeupInterval = setInterval(() => {
      this.wakeupBackend();
    }, 10 * 60 * 1000); // 10 minutes

    // Initial wakeup
    this.wakeupBackend();
  }

  stopPeriodicWakeup(): void {
    if (this.wakeupInterval) {
      clearInterval(this.wakeupInterval);
      this.wakeupInterval = null;
    }
  }

  async ensureBackendAwake(): Promise<boolean> {
    console.log('🔍 Checking if backend is awake...');
    
    // First try a quick ping
    try {
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://collabai.onrender.com' 
        : 'http://localhost:3001';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second quick check

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Backend is already awake');
        return true;
      }
    } catch (error) {
      console.log('💤 Backend appears to be sleeping, waking it up...');
    }

    // If quick ping fails, do full wakeup
    return await this.wakeupBackend();
  }
}

export const backendWakeupService = BackendWakeupService.getInstance();
