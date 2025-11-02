import { NextRequest, NextResponse } from 'next/server';
import { AIReorderService } from '@/services/aiReorderService';
import { prisma } from '@/lib/prisma';

// Handle CORS preflight request
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Reorder API called');
    const body = await request.json();
    const { sprintId, criteria = 'priority', teamCapacity, sprintGoals } = body;
    
    console.log('AI Reorder request:', { sprintId, criteria, teamCapacity });
    
    // Get backlog items for the sprint
    const backlogItems = await prisma.backlogItem.findMany({
      where: sprintId ? { sprintId: parseInt(sprintId) } : { sprintId: null },
      include: {
        owner: true,
        sprint: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${backlogItems.length} backlog items`);
    
    if (backlogItems.length === 0) {
      return NextResponse.json({ 
        error: 'No backlog items found for reordering' 
      }, { status: 400 });
    }
    
    console.log(`Found ${backlogItems.length} items to reorder`);
    
    // Call AI Reorder Service
    const reorderResult = await AIReorderService.reorderBacklog({
      backlogItems,
      criteria,
      teamCapacity,
      sprintGoals
    });
    
    // Save the reordered items to database
    if (sprintId) {
      await AIReorderService.saveReorderedBacklog(sprintId, reorderResult.reorderedItems);
    }
    
    return NextResponse.json({
      success: true,
      result: reorderResult,
      message: `Successfully reordered ${reorderResult.reorderedItems.length} items`
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('AI Reorder API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to reorder backlog items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');
    
    // Get current backlog items
    const backlogItems = await prisma.backlogItem.findMany({
      where: sprintId ? { sprintId: parseInt(sprintId) } : { sprintId: null },
      include: {
        owner: true,
        sprint: true
      },
      orderBy: [
        { priority: 'asc' }, // Use priority instead of order
        { createdAt: 'asc' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      items: backlogItems,
      count: backlogItems.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('Get backlog items error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch backlog items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}