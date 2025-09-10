import { prisma } from '@/lib/prisma';

export async function getBacklogItems() {
  return await prisma.backlogItem.findMany({ include: { owner: true, sprint: true, dependencies: true } });
}

export async function createBacklogItem(data: {
  type: string;
  title: string;
  description?: string;
  storyPoints?: number;
  ownerId?: number;
  priority?: number;
  status?: string;
  sprintId?: number;
  dependencies?: number[];
}) {
  return await prisma.backlogItem.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      storyPoints: data.storyPoints,
      ownerId: data.ownerId,
      priority: data.priority,
      status: data.status,
      sprintId: data.sprintId,
      dependencies: { connect: data.dependencies },
    },
  });
}

export async function updateBacklogItem(id: number, data: Partial<{
  type: string;
  title: string;
  description?: string;
  storyPoints?: number;
  ownerId?: number;
  priority?: number;
  status?: string;
  sprintId?: number;
}>) {
  return await prisma.backlogItem.update({ where: { id },data });
}

export async function deleteBacklogItem(id: number) {
  return await prisma.backlogItem.delete({ where: { id } });
}