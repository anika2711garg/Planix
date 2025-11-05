// Update sprint metrics route
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
        // Calculate realistic velocity metrics based on the sprint's items
        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: { items: true }
        });

        if (!sprint) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404, headers: corsHeaders });
        }

        // Calculate realistic metrics based on the actual sprint data
        const totalItems = sprint.items.length;
        const completedItems = sprint.items.filter(item => item.status.toLowerCase() === 'done').length;
        const averageDelay = 15.5; // 15.5 minutes average delay per task
        const onTimeRatio = completedItems / totalItems;
        const efficiency = completedItems / totalItems * 1.2; // Slightly above 1 if all tasks completed

        // Add velocity metrics - calculate average points completed per day
        const totalPoints = sprint.items.reduce((sum, item) => sum + item.storyPoints, 0);
        const sprintDays = Math.ceil((sprint.endDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const averagePointsPerDay = totalPoints / sprintDays;
        
        const velocityMetric = await prisma.velocityMetric.create({
            data: {
                sprintId: sprintId,
                averagePoints: averagePointsPerDay,
            }
        });

        // Get the first team member to assign workload to (we need a userId)
        const teamMember = await prisma.user.findFirst({
            where: { teamId: sprint.teamId }
        });

        if (!teamMember) {
            return NextResponse.json({ error: 'No team members found' }, { status: 400, headers: corsHeaders });
        }

        // Add workload distribution
        const workloadDistribution = await prisma.workloadDistribution.create({
            data: {
                sprintId: sprintId,
                userId: teamMember.id,
                assignedPoints: totalPoints,
                completedPoints: sprint.items
                    .filter(item => item.status.toLowerCase() === 'done')
                    .reduce((sum, item) => sum + item.storyPoints, 0)
            }
        });

        return NextResponse.json({
            message: 'Sprint metrics updated successfully',
            velocityMetric,
            workloadDistribution
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error(`Error updating sprint ${sprintId} metrics:`, error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500, headers: corsHeaders });
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