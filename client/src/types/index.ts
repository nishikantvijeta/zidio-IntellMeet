export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface TranscriptEntry {
  sender: string;
  text: string;
  timestamp: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: number;
}

export interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  roomCode: string;
  hostId: string;
  participants: string[];
  isLive: boolean;
  duration?: number;
  summary?: string;
  actionItems?: string[];
  sentimentScores?: SentimentScores;
  transcript: TranscriptEntry[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}
