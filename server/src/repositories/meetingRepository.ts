import MeetingModel, { IMeeting } from '../models/Meeting';
import { isMockDb } from '../config/db';
import { mockDb, generateId, DbMeeting } from './mockDb';

export class MeetingRepository {
  static async findByRoomCode(roomCode: string): Promise<DbMeeting | null> {
    const cleanRoomCode = roomCode.trim();
    if (isMockDb) {
      const m = mockDb.getMeetings().find(meeting => meeting.roomCode === cleanRoomCode);
      return m ? { ...m } : null;
    }
    const meetingDoc = await MeetingModel.findOne({ roomCode: cleanRoomCode });
    return meetingDoc ? (meetingDoc.toObject() as any as DbMeeting) : null;
  }

  static async findById(id: string): Promise<DbMeeting | null> {
    if (isMockDb) {
      const m = mockDb.getMeetings().find(meeting => meeting._id === id);
      return m ? { ...m } : null;
    }
    const meetingDoc = await MeetingModel.findById(id);
    return meetingDoc ? (meetingDoc.toObject() as any as DbMeeting) : null;
  }

  static async create(meetingData: Partial<IMeeting>): Promise<DbMeeting> {
    if (isMockDb) {
      const newMeeting: DbMeeting = {
        _id: generateId(),
        title: meetingData.title || 'Untitled Meeting',
        roomCode: meetingData.roomCode || '',
        hostId: meetingData.hostId || '',
        participants: meetingData.participants || [],
        isLive: meetingData.isLive ?? true,
        duration: meetingData.duration || 0,
        summary: meetingData.summary || '',
        actionItems: meetingData.actionItems || [],
        sentimentScores: meetingData.sentimentScores || { positive: 0, neutral: 0, negative: 0 },
        transcript: meetingData.transcript || [],
        attachments: meetingData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return mockDb.saveMeeting(newMeeting);
    }
    const meetingDoc = await MeetingModel.create(meetingData);
    return meetingDoc.toObject() as any as DbMeeting;
  }

  static async update(id: string, updates: Partial<IMeeting>): Promise<DbMeeting | null> {
    if (isMockDb) {
      const existing = mockDb.getMeetings().find(m => m._id === id);
      if (!existing) return null;
      const updatedMeeting: DbMeeting = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };
      return mockDb.saveMeeting(updatedMeeting);
    }
    const meetingDoc = await MeetingModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return meetingDoc ? (meetingDoc.toObject() as any as DbMeeting) : null;
  }

  static async listUserMeetings(userId: string): Promise<DbMeeting[]> {
    if (isMockDb) {
      return mockDb.getMeetings()
        .filter(m => m.hostId === userId || m.participants.includes(userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const meetings = await MeetingModel.find({
      $or: [{ hostId: userId }, { participants: userId }]
    }).sort({ createdAt: -1 });
    return meetings.map(m => m.toObject() as any as DbMeeting);
  }
}
