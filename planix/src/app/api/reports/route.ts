import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSprintSummaryReport, 
  generateVelocityReport, 
  generateTeamPerformanceReport, 
  generateBurndownReport,
  getAvailableSprintsForReports 
} from '@/services/reportsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const sprintId = searchParams.get('sprintId');
    const teamId = searchParams.get('teamId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('📊 Reports API called:', { reportType, sprintId, teamId, startDate, endDate });

    // Handle different report types
    switch (reportType) {
      case 'sprint-summary':
        if (!sprintId) {
          return NextResponse.json({ error: 'Sprint ID is required for sprint summary' }, { status: 400 });
        }
        const sprintSummary = await generateSprintSummaryReport(parseInt(sprintId));
        return NextResponse.json(sprintSummary);

      case 'velocity':
        const dateRange = startDate && endDate ? {
          start: new Date(startDate),
          end: new Date(endDate)
        } : undefined;
        const velocityReport = await generateVelocityReport(
          teamId ? parseInt(teamId) : undefined, 
          dateRange
        );
        return NextResponse.json(velocityReport);

      case 'team-performance':
        if (!teamId) {
          return NextResponse.json({ error: 'Team ID is required for team performance' }, { status: 400 });
        }
        const teamDateRange = startDate && endDate ? {
          start: new Date(startDate),
          end: new Date(endDate)
        } : undefined;
        const teamReport = await generateTeamPerformanceReport(parseInt(teamId), teamDateRange);
        return NextResponse.json(teamReport);

      case 'burndown':
        if (!sprintId) {
          return NextResponse.json({ error: 'Sprint ID is required for burndown analysis' }, { status: 400 });
        }
        const burndownReport = await generateBurndownReport(parseInt(sprintId));
        return NextResponse.json(burndownReport);

      case 'available-sprints':
        const availableSprints = await getAvailableSprintsForReports(
          teamId ? parseInt(teamId) : undefined
        );
        return NextResponse.json(availableSprints);

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, sprintId, teamId, startDate, endDate, customParams } = body;

    console.log('📊 Custom Reports API called:', { reportType, sprintId, teamId, customParams });

    // Handle custom report generation with additional parameters
    switch (reportType) {
      case 'custom-sprint':
        if (!sprintId) {
          return NextResponse.json({ error: 'Sprint ID is required' }, { status: 400 });
        }
        
        const sprintReport = await generateSprintSummaryReport(parseInt(sprintId));
        
        // Add custom parameters if provided
        const enhancedReport = {
          ...sprintReport,
          ...(customParams?.includeDetails && { detailedBreakdown: true })
        };
        
        return NextResponse.json(enhancedReport);

      case 'multi-sprint-comparison':
        const sprintIds = customParams?.sprintIds;
        if (!sprintIds || !Array.isArray(sprintIds)) {
          return NextResponse.json({ error: 'Sprint IDs array is required' }, { status: 400 });
        }

        const comparisons = await Promise.all(
          sprintIds.map(id => generateSprintSummaryReport(parseInt(id)))
        );

        return NextResponse.json({
          comparison: comparisons,
          summary: {
            totalSprints: comparisons.length,
            averageCompletion: comparisons.reduce((sum, sprint) => sum + sprint.summary.completionRate, 0) / comparisons.length,
            totalPoints: comparisons.reduce((sum, sprint) => sum + sprint.summary.total, 0),
            totalCompleted: comparisons.reduce((sum, sprint) => sum + sprint.summary.completed, 0)
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid custom report type' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Custom Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}