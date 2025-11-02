import { NextResponse, NextRequest } from 'next/server';
import { handleOptions, corsHeaders } from '@/lib/cors';
import { verifyAuth } from '@/lib/auth-middleware';
import * as performanceService from '@/services/performanceService';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const teamId = url.searchParams.get('teamId');
    const sprintId = url.searchParams.get('sprintId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let data;
    switch (type) {
      case 'team':
        data = await performanceService.getTeamPerformance(teamId ? parseInt(teamId) : undefined);
        break;
      case 'sprint':
        data = await performanceService.getSprintPerformance(sprintId ? parseInt(sprintId) : undefined);
        break;
      case 'velocity':
        data = await performanceService.getVelocityMetrics(teamId ? parseInt(teamId) : undefined);
        break;
      case 'burndown':
        data = await performanceService.getBurndownData(sprintId ? parseInt(sprintId) : undefined);
        break;
      case 'completion':
        data = await performanceService.getCompletionMetrics(
          teamId ? parseInt(teamId) : undefined,
          startDate || undefined,
          endDate || undefined
        );
        break;
      default:
        data = await performanceService.getDashboardMetrics();
    }

    const response = NextResponse.json(data);
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Performance API error:', error);
    const response = NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}