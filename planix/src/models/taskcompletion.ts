import { prisma } from '@/lib/prisma';

export async function getTaskCompletions() {
  return await prisma.taskCompletion.findMany({ include: { backlogItem: true } });
}

export async function createTaskCompletion(data: { backlogItemId: number; plannedTime: bigint; actualTime?: bigint; delayReason?: string }) {
  return await prisma.taskCompletion.create({ data });
}

export async function updateTaskCompletion(id: number, data: Partial<{ backlogItemId: number; plannedTime: bigint; actualTime?: bigint; delayReason?: string }>) {
  return await prisma.taskCompletion.update({ where: { id }, data });
}

export async function deleteTaskCompletion(id: number) {
  return await prisma.taskCompletion.delete({ where: { id } });
}