import { NextResponse } from 'next/server';
import * as sprintService from '@/services/sprintService';

export async function GET() {
  try {
    const sprints = await sprintService.getAllSprints();
    return NextResponse.json(sprints);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sprint = await sprintService.createNewSprint(data);
    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create sprint' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const sprint = await sprintService.updateExistingSprint(id, data);
    return NextResponse.json(sprint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sprint' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await sprintService.removeSprint(id);
    return NextResponse.json({ message: 'Sprint deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sprint' }, { status: 400 });
  }
}