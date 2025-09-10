import * as velocityModel from '@/models/velocitymatrics';

export async function getAllVelocityMetrics() {
  return await velocityModel.getVelocityMetrics();
}

export async function createNewVelocityMetric(data: { sprintId: number; averagePoints: number }) {
  if (!data.sprintId || data.averagePoints === undefined) throw new Error('Sprint ID and average points are required');
  if (data.averagePoints < 0) throw new Error('Average points cannot be negative');
  return await velocityModel.createVelocityMetric(data);
}

export async function updateExistingVelocityMetric(id: number, data: Partial<{ sprintId: number; averagePoints: number }>) {
  if (data.averagePoints && data.averagePoints < 0) throw new Error('Average points cannot be negative');
  return await velocityModel.updateVelocityMetric(id, data);
}

export async function removeVelocityMetric(id: number) {
  return await velocityModel.deleteVelocityMetric(id);
}