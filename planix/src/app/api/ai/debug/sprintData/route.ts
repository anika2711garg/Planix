// Debug endpoint to see raw sprint data
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    const body = await request.json();
    const sprintId = body.sprintId;
    const origin = request.headers.get('origin') || '*';

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (typeof sprintId !== 'number') {
        return NextResponse.json({ error: 'Invalid or missing sprintId' }, { status: 400, headers: corsHeaders });
    }

    try {
        const rawSprintData = await (prisma as any).sprint.findUnique({
            where: { id: sprintId },
            include: {
                items: true,
                velocityMetrics: true,
                workloadDistributions: true,
                team: true,
            },
        });

        if (!rawSprintData) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404, headers: corsHeaders });
        }

        // Return all raw data
        return NextResponse.json({
            sprintId,
            rawData: {
                id: rawSprintData.id,
                name: rawSprintData.name,
                startDate: rawSprintData.startDate,
                endDate: rawSprintData.endDate,
                status: rawSprintData.status,
                teamId: rawSprintData.teamId,
                items: rawSprintData.items?.map(item => ({
                    id: item.id,
                    title: item.title,
                    status: item.status,
                    priority: item.priority,
                    storyPoints: item.storyPoints,
                })),
                velocityMetrics: rawSprintData.velocityMetrics?.map(vm => ({
                    id: vm.id,
                    averageDelay: vm.averageDelay,
                    onTimeRatio: vm.onTimeRatio,
                    efficiency: vm.efficiency,
                })),
                workloadDistributions: rawSprintData.workloadDistributions?.map(wd => ({
                    id: wd.id,
                    efficiency: wd.efficiency,
                })),
                team: rawSprintData.team ? {
                    id: rawSprintData.team.id,
                    name: rawSprintData.team.name,
                } : null,
            },
            computedFeatures: {
                total_backlog_items: rawSprintData.items?.length ?? 0,
                total_story_points: rawSprintData.items?.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0) ?? 0,
                completion_ratio: rawSprintData.items?.filter((item: any) => String(item.status).toLowerCase() === 'done').length ?? 0,
                avg_priority: rawSprintData.items?.reduce((sum: number, item: any) => sum + (typeof item.priority === 'number' ? item.priority : 2), 0) / (rawSprintData.items?.length || 1),
            }
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error(`Error fetching sprint ${sprintId} data:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}

// Handle preflight CORS
export function OPTIONS(request: Request) {
    const origin = request.headers.get('origin') || '*';
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };
    return new NextResponse(null, { status: 204, headers });
}