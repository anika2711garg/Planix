import * as backlogModel from '@/models/backlog';

export async function getAllBacklogItems() {
  return await backlogModel.getBacklogItems();
}

export async function createNewBacklogItem(data: {
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
  if (!data.type || !data.title) throw new Error('Type and title are required');
  return await backlogModel.createBacklogItem(data);
}

export async function updateExistingBacklogItem(id: number, data: Partial<{
  type: string;
  title: string;
  description?: string;
  storyPoints?: number;
  ownerId?: number;
  priority?: number;
  status?: string;
  sprintId?: number;
}>) {
  return await backlogModel.updateBacklogItem(id, data);
}

export async function removeBacklogItem(id: number) {
  return await backlogModel.deleteBacklogItem(id);
}