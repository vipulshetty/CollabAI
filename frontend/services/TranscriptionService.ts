import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    mozSpeechRecognition: typeof SpeechRecognition;
    msSpeechRecognition: typeof SpeechRecognition;
  }
}

interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class TranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isTranscribing: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private transcripts: string[] = [];
  private maxRetries: number = 5;
  private retryCount: number = 0;
  private retryDelay: number = 1000;
  private isConnected: boolean = false;
  private instanceId: string;

  constructor(
    private socket: Socket,
    private roomId: string,
    private options: TranscriptionOptions = {}
  ) {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    console.log(`🎤 Creating TranscriptionService instance: ${this.instanceId}`);

    // Stop any existing instances before creating a new one
    this.stopExistingInstances();

    this.initializeRecognition();

    // Monitor socket connection
    this.socket.on('connect', () => {
      console.log('TranscriptionService socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('TranscriptionService socket disconnected');
      this.isConnected = false;
    });
  }

  private stopExistingInstances() {
    // Stop any existing speech recognition
    if ((window as any).speechRecognitionActive) {
      console.log('🎤 Stopping existing speech recognition instance');
      (window as any).speechRecognitionActive = false;
    }

    // Clear any existing global instance
    if ((window as any).currentTranscriptionService) {
      const existingService = (window as any).currentTranscriptionService;
      if (existingService && existingService.stop) {
        existingService.stop();
      }
    }

    // Set this as the current instance
    (window as any).currentTranscriptionService = this;
  }

  private initializeRecognition() {
    try {
      // Try to get the SpeechRecognition constructor from different browser implementations
      const SpeechRecognition = 
        window.SpeechRecognition || 
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser');
      }

      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.recognition = null;
      
      // Notify the socket about the initialization failure
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: 'Speech recognition initialization failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Configure recognition settings
    this.recognition.lang = this.options.language || 'en-US';
    this.recognition.continuous = this.options.continuous ?? true;
    this.recognition.interimResults = this.options.interimResults ?? true;

    // Handle recognition start
    this.recognition.onstart = () => {
      console.log('Transcription started');
      this.isTranscribing = true;
      this.socket.emit('transcription-status', { 
        roomId: this.roomId, 
        status: 'started' 
      });
    };

    // Handle recognition errors
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);
  }

  private handleError(event: SpeechRecognitionErrorEvent) {
    const errorDetails = {
      type: event.error,
      message: event.message || 'No error message available',
      isTranscribing: this.isTranscribing,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      instanceId: this.instanceId
    };

    // Only log meaningful errors
    if (event.error !== 'no-speech') {
      console.error(`🎤 [${this.instanceId}] Speech recognition error:`, {
        type: errorDetails.type,
        message: errorDetails.message
      });
    }

    // Notify the socket about the error (except for no-speech)
    if (this.socket?.connected && event.error !== 'no-speech') {
      this.socket.emit('transcription-error', {
        roomId: this.roomId,
        ...errorDetails
      });
    }

    // Handle specific error types
    switch (event.error) {
      case 'not-allowed':
        this.handlePermissionDenied();
        break;
      case 'no-speech':
        // Don't treat no-speech as an error, just continue
        break;
      case 'network':
        this.handleNetworkError();
        break;
      case 'aborted':
        // Only reconnect if this is the current active instance and we're still supposed to be transcribing
        if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
          console.log(`🎤 [${this.instanceId}] Speech recognition aborted, attempting reconnect`);
          this.attemptReconnect();
        } else {
          console.log(`🎤 [${this.instanceId}] Speech recognition aborted, but not reconnecting (not active instance or not transcribing)`);
          (window as any).speechRecognitionActive = false;
        }
        break;
      case 'audio-capture':
        this.handleAudioCaptureError();
        break;
      case 'service-not-allowed':
        this.handleServiceNotAllowed();
        break;
      default:
        if (this.isTranscribing) {
          this.attemptReconnect();
        }
    }
  }

  private handlePermissionDenied() {
    console.error('Microphone access was denied by the user');
    (window as any).speechRecognitionActive = false;
    this.stop();
    // Notify UI about permission denial
    if (this.socket?.connected) {
      this.socket.emit('transcription-permission-denied', {
        roomId: this.roomId
      });
    }
  }

  private handleNetworkError() {
    console.error('Network error occurred during transcription');
    this.attemptReconnect();
  }

  private handleAudioCaptureError() {
    console.error('No microphone found or microphone is not working');
    (window as any).speechRecognitionActive = false;
    this.stop();
    if (this.socket?.connected) {
      this.socket.emit('transcription-device-error', {
        roomId: this.roomId,
        error: 'No microphone found or microphone is not working'
      });
    }
  }

  private handleServiceNotAllowed() {
    console.error('Speech recognition service is not allowed');
    (window as any).speechRecognitionActive = false;
    this.stop();
    if (this.socket?.connected) {
      this.socket.emit('transcription-service-error', {
        roomId: this.roomId,
        error: 'Speech recognition service is not allowed'
      });
    }
  }

  private attemptReconnect() {
    // Only reconnect if this is the current active instance
    if ((window as any).currentTranscriptionService !== this) {
      console.log(`🎤 [${this.instanceId}] Not attempting reconnect - not the active instance`);
      return;
    }

    if (this.retryCount < this.maxRetries) {
      console.log(`🎤 [${this.instanceId}] Attempting to reconnect (${this.retryCount + 1}/${this.maxRetries})`);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        this.retryCount++;
        this.restart();
      }, this.retryDelay * this.retryCount);
    } else {
      console.error(`🎤 [${this.instanceId}] Max retry attempts reached, stopping transcription`);
      this.stop();

      // Notify about max retries reached
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: 'max_retries_reached',
          message: 'Maximum retry attempts reached'
        });
      }
    }
  }

  private handleEnd() {
    console.log('Speech recognition ended');

    if (this.isTranscribing && this.retryCount < this.maxRetries) {
      console.log('Recognition ended while transcribing, attempting to reconnect...');
      this.attemptReconnect();
    } else {
      this.isTranscribing = false;
      // Clear global flag when recognition ends
      (window as any).speechRecognitionActive = false;
      this.socket.emit('transcription-status', {
        roomId: this.roomId,
        status: 'ended'
      });
    }
  }

  private handleResult(event: any) {
    try {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim();

      if (result.isFinal && transcript) {
        console.log(`🎤 [${this.instanceId}] Final Transcript:`, {
          transcript,
          confidence: result[0].confidence,
          total: this.transcripts.length + 1
        });

        this.transcripts.push(transcript);

        // Emit transcript if socket is connected and this is the active instance
        if (this.isConnected && this.socket.connected && (window as any).currentTranscriptionService === this) {
          this.socket.emit('transcription', {
            roomId: this.roomId,
            transcript: transcript,
            timestamp: Date.now(),
            confidence: result[0].confidence
          });
        }
      }
    } catch (error) {
      console.error(`🎤 [${this.instanceId}] Error handling transcription result:`, error);

      // Notify about result handling error
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: 'result_handling_error',
          message: error instanceof Error ? error.message : 'Unknown error processing transcription result'
        });
      }
    }
  }

  public async start() {
    if (!this.recognition) {
      console.error(`🎤 [${this.instanceId}] Speech recognition not initialized`);
      return {
        success: false,
        error: 'Speech recognition not initialized'
      };
    }

    // Check microphone permissions first
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permission.state === 'denied') {
        console.error(`🎤 [${this.instanceId}] Microphone permission denied`);
        return {
          success: false,
          error: 'Microphone permission denied'
        };
      }
    } catch (error) {
      console.warn(`🎤 [${this.instanceId}] Could not check microphone permissions:`, error);
    }

    if (!this.isTranscribing) {
      try {
        this.retryCount = 0;

        // Check if this is the current active instance
        if ((window as any).currentTranscriptionService !== this) {
          console.warn(`🎤 [${this.instanceId}] This is not the current active instance`);
          return {
            success: false,
            error: 'Another transcription service is active'
          };
        }

        // Check if speech recognition is already running globally
        if ((window as any).speechRecognitionActive) {
          console.warn(`🎤 [${this.instanceId}] Speech recognition is already active`);
          return {
            success: false,
            error: 'Speech recognition is already active'
          };
        }

        console.log(`🎤 [${this.instanceId}] Starting speech recognition`);
        (window as any).speechRecognitionActive = true;
        this.recognition.start();
        this.isTranscribing = true;
        return { success: true };
      } catch (error) {
        console.error(`🎤 [${this.instanceId}] Error starting transcription:`, error);
        (window as any).speechRecognitionActive = false;

        // Don't attempt reconnect on start failure, just return error
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start transcription'
        };
      }
    }

    return {
      success: false,
      error: 'Transcription is already running'
    };
  }

  public async stop() {
    console.log(`🎤 [${this.instanceId}] Stopping transcription service`);

    if (this.recognition && this.isTranscribing) {
      try {
        // Save transcripts before stopping
        if (this.transcripts.length > 0) {
          console.log(`🎤 [${this.instanceId}] Stopping transcription with transcripts:`, {
            count: this.transcripts.length,
            transcripts: this.transcripts
          });

          try {
            const result = await this.saveTranscripts();
            console.log(`🎤 [${this.instanceId}] Save transcripts result:`, result);
          } catch (error) {
            console.error(`🎤 [${this.instanceId}] Error saving transcripts:`, error);
          }
        } else {
          console.log(`🎤 [${this.instanceId}] No transcripts to save`);
        }

        this.recognition.stop();
        this.isTranscribing = false;
        this.retryCount = 0;

        // Clear global flags
        (window as any).speechRecognitionActive = false;
        if ((window as any).currentTranscriptionService === this) {
          (window as any).currentTranscriptionService = null;
        }

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        this.socket.emit('transcription-status', {
          roomId: this.roomId,
          status: 'stopped'
        });

        return { success: true };
      } catch (error) {
        console.error(`🎤 [${this.instanceId}] Error stopping transcription:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to stop transcription'
        };
      }
    }

    return { success: true };
  }

  private restart() {
    console.log(`🎤 [${this.instanceId}] Restarting transcription service`);
    this.stop();
    setTimeout(() => {
      if ((window as any).currentTranscriptionService === this) {
        this.start();
      } else {
        console.log(`🎤 [${this.instanceId}] Not restarting - no longer the active instance`);
      }
    }, 1000);
  }

  public getTranscripts(): string[] {
    return [...this.transcripts];
  }

  public clearTranscripts() {
    this.transcripts = [];
  }

  public async saveTranscripts() {
    try {
      console.log('Saving transcripts:', {
        roomId: this.roomId,
        transcriptCount: this.transcripts.length,
        transcripts: this.transcripts
      });

      const response = await fetch(`/api/meetings/${this.roomId}/transcripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcripts: this.transcripts
        })
      });

      const data = await response.json();
      console.log('Save transcripts response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save transcripts');
      }

      return {
        success: true,
        transcriptId: data.id
      };
    } catch (error) {
      console.error('Error saving transcripts:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save transcripts'
      };
    }
  }
}