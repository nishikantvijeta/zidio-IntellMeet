import { Schema, model } from 'mongoose';

export interface INotification {
  recipientId: string;
  senderId: string; // userId or 'system'
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' }
  },
  { timestamps: true }
);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
export default NotificationModel;
