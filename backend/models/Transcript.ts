import mongoose from 'mongoose';

export interface ITranscript {
  meetingId: string;
  transcripts: {
    text: string;
    timestamp: Date;
    speaker?: string;
  }[];
  createdBy: string;
  createdAt: Date;
  metadata?: {
    totalTranscripts: number;
    originalTranscriptsCount: number;
  };
}

const TranscriptSchema = new mongoose.Schema<ITranscript>({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  transcripts: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    speaker: {
      type: String,
      default: 'Unknown'
    }
  }],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    totalTranscripts: Number,
    originalTranscriptsCount: Number
  }
});

export const Transcript = mongoose.model<ITranscript>('Transcript', TranscriptSchema);