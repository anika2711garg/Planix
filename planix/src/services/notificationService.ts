import * as notificationModel from '@/models/notification';

export async function getAllNotifications() {
  return await notificationModel.getNotifications();
}

export async function createNewNotification(data: { userId: number; type: string; message: string }) {
  if (!data.userId || !data.type || !data.message) throw new Error('User ID, type, and message are required');
  if (!['delay', 'risk', 'completion'].includes(data.type)) throw new Error('Invalid notification type');
  return await notificationModel.createNotification(data);
}

export async function updateExistingNotification(id: number, data: Partial<{ userId: number; type: string; message: string }>) {
  if (data.type && !['delay', 'risk', 'completion'].includes(data.type)) throw new Error('Invalid notification type');
  return await notificationModel.updateNotification(id, data);
}

export async function removeNotification(id: number) {
  return await notificationModel.deleteNotification(id);
}