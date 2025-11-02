import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      const response = NextResponse.json({ error: authResult.error }, { status: 401 });
      return handleCors(response);
    }

    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');

    if (!sprintId) {
      const response = NextResponse.json({ error: 'Sprint ID is required' }, { status: 400 });
      return handleCors(response);
    }

    // Get all tasks for the sprint
    const tasks = await prisma.backlogItem.findMany({
      where: {
        sprintId: parseInt(sprintId)
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        priority: 'desc'
      }
    });

    const response = NextResponse.json(tasks);
    return handleCors(response);
  } catch (error) {
    console.error('Error fetching sprint tasks:', error);
    const response = NextResponse.json({ error: 'Failed to fetch sprint tasks' }, { status: 500 });
    return handleCors(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      const response = NextResponse.json({ error: authResult.error }, { status: 401 });
      return handleCors(response);
    }

    const data = await request.json();
    const { title, description, storyPoints, priority, status, sprintId, ownerId, type } = data;

    if (!title || !sprintId) {
      const response = NextResponse.json({ error: 'Title and Sprint ID are required' }, { status: 400 });
      return handleCors(response);
    }

    const task = await prisma.backlogItem.create({
      data: {
        title,
        description: description || '',
        storyPoints: parseInt(storyPoints) || 0,
        priority: parseInt(priority) || 0,
        status: status || 'todo',
        sprintId: parseInt(sprintId),
        ownerId: ownerId ? parseInt(ownerId) : null,
        type: type || 'task'
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    const response = NextResponse.json(task, { status: 201 });
    return handleCors(response);
  } catch (error) {
    console.error('Error creating sprint task:', error);
    const response = NextResponse.json({ error: 'Failed to create sprint task' }, { status: 500 });
    return handleCors(response);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      const response = NextResponse.json({ error: authResult.error }, { status: 401 });
      return handleCors(response);
    }

    const data = await request.json();
    const { id, title, description, storyPoints, priority, status, ownerId } = data;

    if (!id) {
      const response = NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      return handleCors(response);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (storyPoints !== undefined) updateData.storyPoints = parseInt(storyPoints);
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (status !== undefined) updateData.status = status;
    if (ownerId !== undefined) updateData.ownerId = ownerId ? parseInt(ownerId) : null;

    const task = await prisma.backlogItem.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    const response = NextResponse.json(task);
    return handleCors(response);
  } catch (error) {
    console.error('Error updating sprint task:', error);
    const response = NextResponse.json({ error: 'Failed to update sprint task' }, { status: 500 });
    return handleCors(response);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      const response = NextResponse.json({ error: authResult.error }, { status: 401 });
      return handleCors(response);
    }

    const { id } = await request.json();

    if (!id) {
      const response = NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      return handleCors(response);
    }

    await prisma.backlogItem.delete({
      where: { id: parseInt(id) }
    });

    const response = NextResponse.json({ message: 'Task deleted successfully' });
    return handleCors(response);
  } catch (error) {
    console.error('Error deleting sprint task:', error);
    const response = NextResponse.json({ error: 'Failed to delete sprint task' }, { status: 500 });
    return handleCors(response);
  }
}