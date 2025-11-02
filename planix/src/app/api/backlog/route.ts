import { NextResponse, NextRequest } from 'next/server';
import * as backlogService from '@/services/backlogService';
import { verifyAuth } from '@/lib/auth-middleware';
import { handleOptions, corsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await backlogService.getAllBacklogItems();
    const response = NextResponse.json(items);
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch backlog items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const item = await backlogService.createNewBacklogItem(data);
    const response = NextResponse.json(item, { status: 201 });
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create backlog item' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await request.json();
    const item = await backlogService.updateExistingBacklogItem(id, data);
    const response = NextResponse.json(item);
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update backlog item' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    await backlogService.removeBacklogItem(id);
    const response = NextResponse.json({ message: 'Backlog item deleted' });
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete backlog item' }, { status: 400 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions();
}