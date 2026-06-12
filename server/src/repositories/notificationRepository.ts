import NotificationModel, { INotification } from '../models/Notification';
import { isMockDb } from '../config/db';
import { mockDb, generateId, DbNotification } from './mockDb';

export class NotificationRepository {
  static async create(notifData: Partial<INotification>): Promise<DbNotification> {
    if (isMockDb) {
      const newNotif: DbNotification = {
        _id: generateId(),
        recipientId: notifData.recipientId || '',
        senderId: notifData.senderId || 'system',
        content: notifData.content || '',
        isRead: notifData.isRead || false,
        link: notifData.link || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return mockDb.saveNotification(newNotif);
    }
    const notifDoc = await NotificationModel.create(notifData);
    return notifDoc.toObject() as any as DbNotification;
  }

  static async listUserNotifications(userId: string): Promise<DbNotification[]> {
    if (isMockDb) {
      return mockDb.getNotifications()
        .filter(n => n.recipientId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const notifs = await NotificationModel.find({ recipientId: userId }).sort({ createdAt: -1 });
    return notifs.map(n => n.toObject() as any as DbNotification);
  }

  static async markAsRead(id: string): Promise<DbNotification | null> {
    if (isMockDb) {
      const existing = mockDb.getNotifications().find(n => n._id === id);
      if (!existing) return null;
      const updated = { ...existing, isRead: true, updatedAt: new Date() };
      return mockDb.saveNotification(updated);
    }
    const notifDoc = await NotificationModel.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true });
    return notifDoc ? (notifDoc.toObject() as any as DbNotification) : null;
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    if (isMockDb) {
      mockDb.getNotifications().forEach(n => {
        if (n.recipientId === userId) {
          n.isRead = true;
          n.updatedAt = new Date();
        }
      });
      mockDb.saveNotification(null as any); // trigger save
      return true;
    }
    await NotificationModel.updateMany({ recipientId: userId }, { $set: { isRead: true } });
    return true;
  }
}
