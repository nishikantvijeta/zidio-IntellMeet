import { Schema, model, Types } from 'mongoose';

export interface ITranscriptEntry {
  sender: string;
  text: string;
  timestamp: Date;
}

export interface IAttachment {
  name: string;
  url: string;
  size: number;
}

export interface ISentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

export interface IMeeting {
  title: string;
  roomCode: string;
  hostId: string;
  participants: string[];
  isLive: boolean;
  duration?: number; // in seconds
  summary?: string;
  actionItems?: string[];
  sentimentScores?: ISentimentScores;
  transcript: ITranscriptEntry[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSchema = new Schema<ITranscriptEntry>({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const attachmentSchema = new Schema<IAttachment>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true }
});

const sentimentScoresSchema = new Schema<ISentimentScores>({
  positive: { type: Number, default: 0 },
  neutral: { type: Number, default: 0 },
  negative: { type: Number, default: 0 }
});

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    roomCode: { type: String, required: true, unique: true, index: true },
    hostId: { type: String, required: true },
    participants: [{ type: String }],
    isLive: { type: Boolean, default: true },
    duration: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    actionItems: [{ type: String }],
    sentimentScores: { type: sentimentScoresSchema, default: () => ({ positive: 0, neutral: 0, negative: 0 }) },
    transcript: [transcriptSchema],
    attachments: [attachmentSchema]
  },
  { timestamps: true }
);

export const MeetingModel = model<IMeeting>('Meeting', meetingSchema);
export default MeetingModel;
