import { prisma } from '@/lib/prisma';

export async function getSprints() {
  return await prisma.sprint.findMany({ include: { team: true, items: true } });
}

export async function createSprint(data: { name: string; goals: string; startDate: Date; endDate: Date; teamId: number; scopeAdjusted: boolean }) {
  return await prisma.sprint.create({ data });
}

export async function updateSprint(id: number, data: Partial<{ name: string; goals: string; startDate: Date; endDate: Date; teamId: number; scopeAdjusted: boolean }>) {
  return await prisma.sprint.update({ where: { id }, data });
}

export async function deleteSprint(id: number) {
  return await prisma.sprint.delete({ where: { id } });
}