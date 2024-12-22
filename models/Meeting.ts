import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  speaker: { type: String, required: true },
  text: { type: String, required: true }
});

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, required: true },
  date: { type: Date, required: true },
  id: { type: String, required: true },
  createdBy: { type: String, required: true },
  participants: [{ type: String }],
  transcripts:  {
    type: [String],
    default: []
},
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema)