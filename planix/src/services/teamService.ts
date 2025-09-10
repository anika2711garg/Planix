import * as teamModel from '@/models/team';

export async function getAllTeams() {
  return await teamModel.getTeams();
}

export async function createNewTeam(data: { name: string }) {
  if (!data.name) throw new Error('Team name is required');
  return await teamModel.createTeam(data);
}

export async function updateExistingTeam(id: number, data: Partial<{ name: string }>) {
  if (data.name && !data.name.trim()) throw new Error('Team name cannot be empty');
  return await teamModel.updateTeam(id, data);
}

export async function removeTeam(id: number) {
  return await teamModel.deleteTeam(id);
}