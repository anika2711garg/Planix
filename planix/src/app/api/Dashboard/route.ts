import { NextRequest, NextResponse } from 'next/server';
import { handleCors, handleOptions } from '@/lib/cors';
import { verifyAuth } from '../../../lib/auth-middleware';
import { getDashboardData } from '../../../services/dashboardService';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return handleCors(response);
    }

    // Get dashboard data for the authenticated user
    const dashboardData = await getDashboardData(authResult.user.id);

    const response = NextResponse.json({ 
      success: true, 
      data: dashboardData 
    });
    return handleCors(response);
  } catch (error) {
    console.error('Dashboard API error:', error);
    const response = NextResponse.json({ 
      error: 'Failed to fetch dashboard data' 
    }, { status: 500 });
    return handleCors(response);
  }
}