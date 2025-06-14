import { Socket } from 'socket.io-client';

// Enhanced Speech Recognition types for better browser compatibility
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
  }
}

// Enhanced browser compatibility detection
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSecureContext = window.isSecureContext || location.protocol === 'https:';

  return { isChrome, isFirefox, isSafari, isEdge, isMobile, isSecureContext };
};

// Check Speech Recognition support
const getSpeechRecognitionSupport = () => {
  const browserInfo = getBrowserInfo();

  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Not in browser environment' };
  }

  if (!browserInfo.isSecureContext) {
    return { supported: false, reason: 'Requires HTTPS or localhost' };
  }

  if (window.SpeechRecognition) {
    return { supported: true, constructor: window.SpeechRecognition, browser: 'standard' };
  }

  if (window.webkitSpeechRecognition) {
    return { supported: true, constructor: window.webkitSpeechRecognition, browser: 'webkit' };
  }

  if (window.mozSpeechRecognition) {
    return { supported: true, constructor: window.mozSpeechRecognition, browser: 'mozilla' };
  }

  if (window.msSpeechRecognition) {
    return { supported: true, constructor: window.msSpeechRecognition, browser: 'microsoft' };
  }

  return {
    supported: false,
    reason: `Speech Recognition not supported in ${browserInfo.isChrome ? 'Chrome' : browserInfo.isFirefox ? 'Firefox' : browserInfo.isSafari ? 'Safari' : 'this browser'}`
  };
};

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
    this.instanceId = Math.random().toString(36).substring(2, 11);
    console.log(`🎤 Creating TranscriptionService instance: ${this.instanceId}`);

    // Stop any existing instances before creating a new one
    this.stopExistingInstances();

    // Check browser support before initializing
    const support = getSpeechRecognitionSupport();
    if (!support.supported) {
      console.error(`🎤 Speech Recognition not supported: ${support.reason}`);
      return;
    }

    console.log(`🎤 Speech Recognition supported via ${support.browser}`);
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
      const support = getSpeechRecognitionSupport();

      if (!support.supported) {
        throw new Error(`Speech recognition not supported: ${support.reason}`);
      }

      console.log(`🎤 [${this.instanceId}] Initializing with ${support.browser} Speech Recognition`);
      this.recognition = new support.constructor();
      this.setupRecognition();

      console.log(`🎤 [${this.instanceId}] Speech recognition initialized successfully`);
    } catch (error) {
      console.error(`🎤 [${this.instanceId}] Failed to initialize speech recognition:`, error);
      this.recognition = null;

      // Try fallback initialization
      try {
        console.log(`🎤 [${this.instanceId}] Attempting fallback initialization...`);
        const SpeechRecognition =
          window.SpeechRecognition ||
          window.webkitSpeechRecognition ||
          window.mozSpeechRecognition ||
          window.msSpeechRecognition;

        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          this.setupRecognition();
          console.log(`🎤 [${this.instanceId}] Fallback initialization successful`);
        } else {
          throw new Error('No Speech Recognition implementation found');
        }
      } catch (fallbackError) {
        console.error(`🎤 [${this.instanceId}] Fallback initialization failed:`, fallbackError);

        // Notify the socket about the initialization failure
        if (this.socket && this.socket.connected) {
          this.socket.emit('transcription-error', {
            roomId: this.roomId,
            error: 'Speech recognition initialization failed',
            details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
        }
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Enhanced configuration for better stability
    this.recognition.lang = this.options.language || 'en-US';
    this.recognition.continuous = true; // Always continuous
    this.recognition.interimResults = true; // Always show interim results
    this.recognition.maxAlternatives = 1; // Reduce processing overhead

    // Add grammars for better recognition (if supported)
    try {
      if ('webkitSpeechGrammarList' in window) {
        const grammar = '#JSGF V1.0; grammar common; public <common> = hello | hi | yes | no | okay | thanks | meeting | call | video | audio | chat | share | screen | record | stop | start | end | join | leave;';
        const speechRecognitionList = new (window as any).webkitSpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        (this.recognition as any).grammars = speechRecognitionList;
      }
    } catch (error) {
      console.log(`🎤 [${this.instanceId}] Grammar not supported, continuing without it`);
    }

    // Handle recognition start
    this.recognition.onstart = () => {
      console.log(`🎤 [${this.instanceId}] Speech recognition started successfully`);
      this.isTranscribing = true;
      this.retryCount = 0; // Reset retry count on successful start
      this.socket.emit('transcription-status', {
        roomId: this.roomId,
        status: 'started',
        instanceId: this.instanceId
      });
    };

    // Handle recognition errors
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);

    // Add additional event handlers for better debugging (with proper typing)
    try {
      (this.recognition as any).onspeechstart = () => {
        console.log(`🎤 [${this.instanceId}] Speech detected`);
      };

      (this.recognition as any).onspeechend = () => {
        console.log(`🎤 [${this.instanceId}] Speech ended`);
      };

      (this.recognition as any).onsoundstart = () => {
        console.log(`🎤 [${this.instanceId}] Sound detected`);
      };

      (this.recognition as any).onsoundend = () => {
        console.log(`🎤 [${this.instanceId}] Sound ended`);
      };
    } catch (error) {
      console.log(`🎤 [${this.instanceId}] Additional event handlers not supported`);
    }
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

    // Handle specific error types with better logic
    switch (event.error) {
      case 'not-allowed':
        console.error(`🎤 [${this.instanceId}] Microphone permission denied`);
        this.handlePermissionDenied();
        break;

      case 'no-speech':
        // Don't treat no-speech as an error, just log and continue
        console.log(`🎤 [${this.instanceId}] No speech detected, continuing...`);
        break;

      case 'network':
        console.warn(`🎤 [${this.instanceId}] Network error during transcription`);
        this.handleNetworkError();
        break;

      case 'aborted':
        console.log(`🎤 [${this.instanceId}] Speech recognition aborted`);
        // Don't immediately reconnect on abort - it might be intentional
        if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
          // Wait a bit before attempting reconnect to avoid rapid cycling
          setTimeout(() => {
            if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
              console.log(`🎤 [${this.instanceId}] Attempting delayed reconnect after abort`);
              this.attemptReconnect();
            }
          }, 1000);
        } else {
          console.log(`🎤 [${this.instanceId}] Not reconnecting after abort (not active or not transcribing)`);
          (window as any).speechRecognitionActive = false;
        }
        break;

      case 'audio-capture':
        console.error(`🎤 [${this.instanceId}] Audio capture error - no microphone found`);
        this.handleAudioCaptureError();
        break;

      case 'service-not-allowed':
        console.error(`🎤 [${this.instanceId}] Speech recognition service not allowed`);
        this.handleServiceNotAllowed();
        break;

      case 'language-not-supported':
        console.error(`🎤 [${this.instanceId}] Language not supported, falling back to en-US`);
        this.recognition!.lang = 'en-US';
        if (this.isTranscribing) {
          this.attemptReconnect();
        }
        break;

      default:
        console.warn(`🎤 [${this.instanceId}] Unknown speech recognition error:`, {
          type: errorDetails.type,
          message: errorDetails.message
        });

        // Only attempt reconnect for unknown errors if we're actively transcribing
        if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
          this.attemptReconnect();
        }
    }

    // Notify the socket about significant errors (not no-speech)
    if (this.socket?.connected && event.error !== 'no-speech') {
      this.socket.emit('transcription-error', {
        roomId: this.roomId,
        ...errorDetails
      });
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

    // Don't reconnect if we're not supposed to be transcribing
    if (!this.isTranscribing) {
      console.log(`🎤 [${this.instanceId}] Not attempting reconnect - transcription stopped`);
      return;
    }

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🎤 [${this.instanceId}] Attempting to reconnect (${this.retryCount}/${this.maxRetries})`);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      // Progressive delay: start with 2 seconds, increase by 1 second each retry
      const delay = Math.min(2000 + (this.retryCount * 1000), 10000);

      this.reconnectTimeout = setTimeout(async () => {
        if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
          try {
            console.log(`🎤 [${this.instanceId}] Restarting speech recognition after ${delay}ms delay`);

            // Ensure we're not already active
            if ((window as any).speechRecognitionActive) {
              console.log(`🎤 [${this.instanceId}] Speech recognition already active, waiting...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (this.recognition && this.isTranscribing) {
              // Reset recognition settings
              this.recognition.continuous = true;
              this.recognition.interimResults = true;
              this.recognition.maxAlternatives = 1;

              (window as any).speechRecognitionActive = true;
              this.recognition.start();
              console.log(`🎤 [${this.instanceId}] Speech recognition restarted successfully`);
            }
          } catch (error) {
            console.error(`🎤 [${this.instanceId}] Error restarting recognition:`, error);
            (window as any).speechRecognitionActive = false;

            // Try again if we haven't exceeded max retries
            if (this.retryCount < this.maxRetries) {
              console.log(`🎤 [${this.instanceId}] Scheduling another reconnect attempt in 3 seconds`);
              setTimeout(() => this.attemptReconnect(), 3000);
            }
          }
        } else {
          console.log(`🎤 [${this.instanceId}] Reconnect cancelled - conditions no longer met`);
        }
      }, delay);
    } else {
      console.error(`🎤 [${this.instanceId}] Max retry attempts reached, stopping transcription`);
      this.stop();

      // Notify about max retries reached
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: 'max_retries_reached',
          message: 'Maximum retry attempts reached. Please try starting transcription again.'
        });
      }
    }
  }

  private handleEnd() {
    console.log(`🎤 [${this.instanceId}] Speech recognition ended`);

    // Clear the active flag immediately
    (window as any).speechRecognitionActive = false;

    // Only attempt to restart if we're supposed to be transcribing and this is the active instance
    if (this.isTranscribing && (window as any).currentTranscriptionService === this) {
      console.log(`🎤 [${this.instanceId}] Recognition ended while transcribing, restarting automatically...`);

      // Restart immediately for continuous transcription
      setTimeout(() => {
        if (this.isTranscribing && (window as any).currentTranscriptionService === this && this.recognition) {
          try {
            console.log(`🎤 [${this.instanceId}] Auto-restarting speech recognition for continuous transcription`);
            (window as any).speechRecognitionActive = true;
            this.recognition.start();
          } catch (error) {
            console.error(`🎤 [${this.instanceId}] Error auto-restarting recognition:`, error);
            (window as any).speechRecognitionActive = false;

            // If auto-restart fails, use the regular reconnect logic
            this.attemptReconnect();
          }
        } else {
          console.log(`🎤 [${this.instanceId}] Not auto-restarting - conditions not met`);
        }
      }, 100); // Very short delay to avoid rapid cycling
    } else {
      console.log(`🎤 [${this.instanceId}] Recognition ended - stopping transcription`);
      this.isTranscribing = false;

      this.socket.emit('transcription-status', {
        roomId: this.roomId,
        status: 'ended',
        instanceId: this.instanceId
      });
    }
  }

  private handleResult(event: any) {
    try {
      if (!event.results || event.results.length === 0) {
        console.log(`🎤 [${this.instanceId}] No results in event`);
        return;
      }

      const result = event.results[event.results.length - 1];
      if (!result || !result[0]) {
        console.log(`🎤 [${this.instanceId}] Invalid result structure`);
        return;
      }

      const transcript = result[0].transcript?.trim();
      const confidence = result[0].confidence || 0;

      // Handle both interim and final results
      if (transcript) {
        if (result.isFinal) {
          console.log(`🎤 [${this.instanceId}] Final Transcript:`, {
            transcript,
            confidence,
            total: this.transcripts.length + 1
          });

          // Only store and emit final results
          this.transcripts.push(transcript);

          // Emit transcript if socket is connected and this is the active instance
          if (this.isConnected && this.socket.connected && (window as any).currentTranscriptionService === this) {
            this.socket.emit('transcription', {
              roomId: this.roomId,
              transcript: transcript,
              timestamp: Date.now(),
              confidence: confidence,
              isFinal: true,
              instanceId: this.instanceId
            });
          }
        } else {
          // Log interim results for debugging but don't store them
          console.log(`🎤 [${this.instanceId}] Interim Transcript:`, transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''));

          // Optionally emit interim results for real-time display
          if (this.isConnected && this.socket.connected && (window as any).currentTranscriptionService === this) {
            this.socket.emit('transcription-interim', {
              roomId: this.roomId,
              transcript: transcript,
              timestamp: Date.now(),
              confidence: confidence,
              isFinal: false,
              instanceId: this.instanceId
            });
          }
        }
      }
    } catch (error) {
      console.error(`🎤 [${this.instanceId}] Error handling transcription result:`, error);

      // Notify about result handling error
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: 'result_handling_error',
          message: error instanceof Error ? error.message : 'Unknown error processing transcription result',
          instanceId: this.instanceId
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

    // Request microphone access explicitly first
    try {
      console.log(`🎤 [${this.instanceId}] Requesting microphone access...`);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log(`🎤 [${this.instanceId}] Microphone access granted`);

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error(`🎤 [${this.instanceId}] Microphone access denied:`, error);
      return {
        success: false,
        error: 'Microphone access denied. Please allow microphone access and try again.'
      };
    }

    // Check microphone permissions
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log(`🎤 [${this.instanceId}] Microphone permission state:`, permission.state);

      if (permission.state === 'denied') {
        console.error(`🎤 [${this.instanceId}] Microphone permission denied`);
        return {
          success: false,
          error: 'Microphone permission denied. Please enable microphone access in your browser settings.'
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
          // Stop the existing one first
          (window as any).speechRecognitionActive = false;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`🎤 [${this.instanceId}] Starting speech recognition with enhanced settings`);

        // Enhanced recognition settings for better stability
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        (window as any).speechRecognitionActive = true;
        this.recognition.start();
        this.isTranscribing = true;

        console.log(`🎤 [${this.instanceId}] Speech recognition started successfully`);
        return { success: true };
      } catch (error) {
        console.error(`🎤 [${this.instanceId}] Error starting transcription:`, error);
        (window as any).speechRecognitionActive = false;

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

    // Don't call stop() as it saves transcripts and clears state
    // Just restart the recognition directly
    if (this.recognition && this.isTranscribing && (window as any).currentTranscriptionService === this) {
      try {
        // Stop current recognition
        this.recognition.stop();
        (window as any).speechRecognitionActive = false;

        // Restart after a short delay
        setTimeout(() => {
          if (this.isTranscribing && (window as any).currentTranscriptionService === this && this.recognition) {
            try {
              console.log(`🎤 [${this.instanceId}] Restarting speech recognition`);
              (window as any).speechRecognitionActive = true;
              this.recognition.start();
            } catch (error) {
              console.error(`🎤 [${this.instanceId}] Error restarting recognition:`, error);
              (window as any).speechRecognitionActive = false;
            }
          }
        }, 500);
      } catch (error) {
        console.error(`🎤 [${this.instanceId}] Error in restart:`, error);
      }
    } else {
      console.log(`🎤 [${this.instanceId}] Not restarting - conditions not met`);
    }
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