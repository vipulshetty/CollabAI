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
    console.log('Speech recognition error:', event.error, 'Details:', {
      isTranscribing: this.isTranscribing,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    });
    
    switch (event.error) {
      case 'no-speech':
        if (this.retryCount > 2) {
          console.log('Multiple no-speech errors detected, checking microphone...');
          this.checkMicrophoneActivity();
        }
        return;
        
      case 'network':
        console.log('Network error detected, attempting reconnect...');
        this.handleReconnect();
        break;
        
      case 'aborted':
      case 'audio-capture':
      case 'not-allowed':
        console.log(`Critical error: ${event.error}, attempting recovery...`);
        if (this.isTranscribing) {
          this.handleReconnect();
        }
        break;
        
      default:
        console.warn('Unhandled speech recognition error:', event.error);
        this.socket.emit('transcription-error', {
          roomId: this.roomId,
          error: event.error,
          timestamp: Date.now()
        });
    }
  }

  private async checkMicrophoneActivity() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const audioLevel = dataArray.reduce((a, b) => a + b) / dataArray.length;
        console.log('Current audio level:', audioLevel);
        
        if (audioLevel < 10) {
          console.warn('Low audio levels detected. Please check your microphone.');
        }
      };

      setTimeout(() => {
        checkAudio();
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      }, 3000);
    } catch (error) {
      console.error('Error checking microphone:', error);
    }
  }

  private handleEnd() {
    if (this.isTranscribing && this.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.retryCount++;
        this.start();
      }, this.retryDelay * this.retryCount);
    } else if (this.retryCount >= this.maxRetries) {
      this.socket.emit('transcription-status', {
        roomId: this.roomId,
        status: 'failed',
        error: 'Max retries reached'
      });
    }
  }

  private handleResult(event: SpeechRecognitionEvent) {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript;

    if (result.isFinal && this.isConnected) {
      console.log('Final Transcript:', transcript);
      this.transcripts.push(transcript);
      this.socket.emit('transcription', {
        roomId: this.roomId,
        transcript: transcript.trim(),
        timestamp: Date.now()
      });
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
}