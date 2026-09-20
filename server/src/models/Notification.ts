import mongoose, { Schema } from 'mongoose';

export interface INotification {
  recipientType: 'instructor' | 'manager';
  recipientId: string;
  channel: 'phone' | 'email';
  message: string;
  sentAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipientType: { type: String, enum: ['instructor', 'manager'], required: true },
  recipientId: { type: String, required: true },
  channel: { type: String, enum: ['phone', 'email'], required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
