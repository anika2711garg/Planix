import { NextResponse } from 'next/server';
import * as backlogService from '@/services/backlogService';

export async function GET() {
  try {
    const items = await backlogService.getAllBacklogItems();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch backlog items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await backlogService.createNewBacklogItem(data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create backlog item' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const item = await backlogService.updateExistingBacklogItem(id, data);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update backlog item' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await backlogService.removeBacklogItem(id);
    return NextResponse.json({ message: 'Backlog item deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete backlog item' }, { status: 400 });
  }
}