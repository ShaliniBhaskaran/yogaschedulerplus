import { Notification, INotification } from '../models/Notification';

export async function sendNotification(
  recipientType: INotification['recipientType'],
  recipientId: string,
  channel: INotification['channel'],
  message: string
): Promise<void> {
  console.log(`[MOCK NOTIFICATION] to ${recipientType} ${recipientId} via ${channel}: ${message}`);
  await Notification.create({ recipientType, recipientId, channel, message });
}
