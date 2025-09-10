import * as taskCompletionModel from '@/models/taskcompletion';

export async function getAllTaskCompletions() {
  return await taskCompletionModel.getTaskCompletions();
}

export async function createNewTaskCompletion(data: { backlogItemId: number; plannedTime: bigint; actualTime?: bigint; delayReason?: string }) {
  if (!data.backlogItemId || !data.plannedTime) throw new Error('Backlog item ID and planned time are required');
  if (data.actualTime && data.actualTime < 0) throw new Error('Actual time cannot be negative');
  return await taskCompletionModel.createTaskCompletion(data);
}

export async function updateExistingTaskCompletion(id: number, data: Partial<{ backlogItemId: number; plannedTime: bigint; actualTime?: bigint; delayReason?: string }>) {
  if (data.actualTime && data.actualTime < 0) throw new Error('Actual time cannot be negative');
  return await taskCompletionModel.updateTaskCompletion(id, data);
}

export async function removeTaskCompletion(id: number) {
  return await taskCompletionModel.deleteTaskCompletion(id);
}