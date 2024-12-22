import { Schema, model, Document } from 'mongoose';

interface Meeting extends Document {
  id: string;
  title: string;
  date: string;
  duration?: string;
  participants: string[];
  status: 'scheduled' | 'active' | 'ended' | 'completed';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  transcripts?: string[];
}

const MeetingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  duration: { type: String },
  participants: { type: [String], required: true },
  status: { type: String, enum: ['scheduled', 'active', 'ended', 'completed'], required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  transcripts: {
    type: [String],
    default: []
  },
});

const MeetingModel = model<Meeting>('Meeting', MeetingSchema);

export { MeetingModel, Meeting };