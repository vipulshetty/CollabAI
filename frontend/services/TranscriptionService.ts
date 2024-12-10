import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export class TranscriptionService {
  private recognition: SpeechRecognition;
  private isTranscribing: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private transcripts: string[] = [];
  private maxRetries: number = 5;
  private retryCount: number = 0;
  private retryDelay: number = 1000;
  private isConnected: boolean = false;

  constructor(
    private socket: Socket,
    private roomId: string,
    private options: TranscriptionOptions = {}
  ) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition();

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

  private setupRecognition() {
    this.recognition.lang = this.options.language || 'en-US';
    this.recognition.continuous = this.options.continuous ?? true;
    this.recognition.interimResults = this.options.interimResults ?? true;

    this.recognition.onstart = () => {
      console.log('Transcription started');
      this.socket.emit('transcription-status', { 
        roomId: this.roomId, 
        status: 'started' 
      });
    };

    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);
  }

  private handleError(event: SpeechRecognitionErrorEvent) {
    console.error('Speech recognition error:', {
      error: event.error,
      isTranscribing: this.isTranscribing,
      retryCount: this.retryCount
    });
  }

  private handleEnd() {
    if (this.isTranscribing && this.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        this.start();
      }, this.retryDelay * this.retryCount);
    }
  }

  private handleResult(event: SpeechRecognitionEvent) {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim();

    if (result.isFinal && transcript) {
      console.log('Final Transcript:', transcript);
      this.transcripts.push(transcript);
      
      // Emit transcript immediately
      if (this.socket && this.socket.connected) {
        this.socket.emit('transcription', {
          roomId: this.roomId,
          transcript: transcript,
          timestamp: Date.now()
        });
      }
    }
  }

  public start() {
    if (!this.isTranscribing) {
      this.isTranscribing = true;
      this.retryCount = 0;
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error starting transcription:', error);
      }
    }
  }

  public stop() {
    this.isTranscribing = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping transcription:', error);
    }
  }

  public getTranscripts(): string[] {
    return [...this.transcripts];
  }

  public clearTranscripts() {
    this.transcripts = [];
  }

  // New method for saving transcripts
  public saveTranscripts() {
    return new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
      const transcripts = this.getTranscripts();
      
      console.log('Attempting to save transcripts:', transcripts);

      if (transcripts.length === 0) {
        console.log('No transcripts to save');
        resolve({ success: true });
        return;
      }

      this.socket.emit('save-meeting-transcripts', {
        meetingId: this.roomId,
        transcripts: transcripts
      }, (response: { success: boolean; error?: string; transcriptId?: string }) => {
        console.log('Transcript save response:', response);

        if (response.success) {
          console.log('Transcripts saved successfully');
          this.clearTranscripts();
          resolve(response);
        } else {
          console.error('Failed to save transcripts:', response.error);
          reject(response);
        }
      });
    });
  }
}