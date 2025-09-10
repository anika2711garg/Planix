import { prisma } from '@/lib/prisma';

export async function getVelocityMetrics() {
  return await prisma.velocityMetric.findMany({ include: { sprint: true } });
}

export async function createVelocityMetric(data: { sprintId: number; averagePoints: number }) {
  return await prisma.velocityMetric.create({ data });
}

export async function updateVelocityMetric(id: number, data: Partial<{ sprintId: number; averagePoints: number }>) {
  return await prisma.velocityMetric.update({ where: { id }, data });
}

export async function deleteVelocityMetric(id: number) {
  return await prisma.velocityMetric.delete({ where: { id } });
}