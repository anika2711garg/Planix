import { prisma } from '@/lib/prisma';

export async function getNotifications() {
  return await prisma.notification.findMany({ include: { user: true } });
}

export async function createNotification(data: { userId: number; type: string; message: string }) {
  return await prisma.notification.create({ data });
}

export async function updateNotification(id: number, data: Partial<{ userId: number; type: string; message: string }>) {
  return await prisma.notification.update({ where: { id }, data });
}

export async function deleteNotification(id: number) {
  return await prisma.notification.delete({ where: { id } });
}