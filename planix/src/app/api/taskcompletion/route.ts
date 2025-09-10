import { NextResponse } from 'next/server';
import * as taskCompletionService from '@/services/taskcompletionService';

export async function GET() {
  try {
    const completions = await taskCompletionService.getAllTaskCompletions();
    return NextResponse.json(completions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task completions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const completion = await taskCompletionService.createNewTaskCompletion(data);
    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create task completion' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const completion = await taskCompletionService.updateExistingTaskCompletion(id, data);
    return NextResponse.json(completion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task completion' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await taskCompletionService.removeTaskCompletion(id);
    return NextResponse.json({ message: 'Task completion deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task completion' }, { status: 400 });
  }
}