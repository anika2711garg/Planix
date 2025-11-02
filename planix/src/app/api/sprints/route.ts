import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { handleCors, handleOptions } from '@/lib/cors';
import * as sprintService from '@/services/sprintService';

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

    const sprints = await sprintService.getAllSprints();
    const response = NextResponse.json(sprints);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
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
    const sprint = await sprintService.createNewSprint(data);
    const response = NextResponse.json(sprint, { status: 201 });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create sprint' }, { status: 400 });
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

    const { id, ...data } = await request.json();
    const sprint = await sprintService.updateExistingSprint(id, data);
    const response = NextResponse.json(sprint);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to update sprint' }, { status: 400 });
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
    await sprintService.removeSprint(id);
    const response = NextResponse.json({ message: 'Sprint deleted' });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to delete sprint' }, { status: 400 });
    return handleCors(response);
  }
}