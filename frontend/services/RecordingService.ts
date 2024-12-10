export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async startRecording(stream: MediaStream): Promise<boolean> {
    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];
        resolve(recordedBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  downloadRecording(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
} 