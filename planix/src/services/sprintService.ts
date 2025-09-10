import * as sprintModel from '@/models/sprint';

export async function getAllSprints() {
  return await sprintModel.getSprints();
}

export async function createNewSprint(data: { name: string; goals: string; startDate: Date; endDate: Date; teamId: number; scopeAdjusted: boolean }) {
  if (!data.name || !data.goals || !data.startDate || !data.endDate || !data.teamId) throw new Error('All sprint fields are required');
  if (data.endDate <= data.startDate) throw new Error('End date must be after start date');
  return await sprintModel.createSprint(data);
}

export async function updateExistingSprint(id: number, data: Partial<{ name: string; goals: string; startDate: Date; endDate: Date; teamId: number; scopeAdjusted: boolean }>) {
  if (data.endDate && data.startDate && data.endDate <= data.startDate) throw new Error('End date must be after start date');
  return await sprintModel.updateSprint(id, data);
}

export async function removeSprint(id: number) {
  return await sprintModel.deleteSprint(id);
}