import { NextRequest, NextResponse } from 'next/server';
import { RLPlanningService } from '@/services/rlPlanningService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sprintId } = body;

        // Get sprint data
        const sprint = await prisma.sprint.findUnique({
            where: { id: parseInt(sprintId) },
            include: {
                items: {
                    include: {
                        owner: true,
                        dependencies: true
                    }
                },
                team: true
            }
        });

        if (!sprint) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
        }

        // Get team capacity and velocity metrics
        const teamCapacity = sprint.team.members.length * 40; // Assuming 40 hours per member
        const velocityMetrics = await prisma.velocityMetric.findMany({
            where: { sprintId: sprint.id },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        const currentVelocity = velocityMetrics[0]?.averagePoints || 30;

        // Get RL model prediction
        const prediction = await RLPlanningService.getPrediction({
            backlogItems: sprint.items,
            teamCapacity,
            sprintGoals: sprint.goals.split(','),
            currentVelocity
        });

        // Save predictions
        await RLPlanningService.saveReorderPrediction(sprintId.toString(), prediction);

        return NextResponse.json({
            success: true,
            prediction
        });

    } catch (error) {
        console.error('RL Planning API Error:', error);
        return NextResponse.json({
            error: 'Failed to get RL model prediction'
        }, { status: 500 });
    }
}