// /src/app/api/ai/predictSprintSuccess/route.ts
// NEXT.JS APP ROUTER API ENDPOINT

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { spawn } from 'child_process';
import path from 'path';

// prisma client imported from lib/prisma

async function callMLService(rawSprintData: any): Promise<{
    predicted_success_score: number;
    confidence_interval: [number, number];
    confidence_value: number;
    risk_level: string;
    message: string;
}> {
    // Calculate required metrics for prediction (defensive against missing relations)
    const items = rawSprintData.items ?? [];
    const total_backlog_items = Array.isArray(items) ? items.length : 0;
    const total_story_points = Array.isArray(items)
        ? items.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0)
        : 0;
    const completed_items = Array.isArray(items)
        ? items.filter((item: any) => String(item.status).toLowerCase() === 'done')
        : [];
    const completion_ratio = total_backlog_items > 0 ? completed_items.length / total_backlog_items : 0;

    // Average priority: schema stores priority as Int; fall back to 2 when missing
    const avg_priority = Array.isArray(items) && total_backlog_items > 0
        ? items.reduce((sum: number, item: any) => sum + (typeof item.priority === 'number' ? item.priority : 2), 0) / total_backlog_items
        : 2;

    // Prepare data for Python script
    // Compute sprint duration from startDate/endDate if available
    let sprint_duration_days = 14;
    try {
        if (rawSprintData.startDate && rawSprintData.endDate) {
            const start = new Date(rawSprintData.startDate);
            const end = new Date(rawSprintData.endDate);
            const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            sprint_duration_days = diffDays;
        }
    } catch (e) {
        sprint_duration_days = 14;
    }

    const velocityMetric = Array.isArray(rawSprintData.velocityMetrics) && rawSprintData.velocityMetrics.length > 0
        ? rawSprintData.velocityMetrics[0]
        : null;

    const workload = Array.isArray(rawSprintData.workloadDistributions) && rawSprintData.workloadDistributions.length > 0
        ? rawSprintData.workloadDistributions[0]
        : null;

    const sprint_data = {
        teamId: rawSprintData.teamId,
        sprint_duration: sprint_duration_days,
        total_backlog_items,
        total_story_points,
        completion_ratio,
        avg_priority,
        avg_delay_minutes: velocityMetric?.averageDelay || 30.5,
        on_time_completion_ratio: velocityMetric?.onTimeRatio || 0.85,
        velocity_efficiency: velocityMetric?.efficiency || 1.1,
        workload_efficiency: workload?.efficiency || 1.05,
        task_density: total_backlog_items / Math.max(1, sprint_duration_days),
        team_experience: 3.8 // Default value, could be calculated from team history
    };

    // Get the absolute path to the Python script and models
    const pythonScriptPath = path.join(process.cwd(), 'src', 'services', 'predict_sprint_success.py');
    
    // For debugging, log the input we're sending
    console.log('Sending sprint_data to Python:', JSON.stringify(sprint_data, null, 2));

    return new Promise((resolve, reject) => {
        // Use the Conda environment's Python
        const pythonProcess = spawn('E:/Anaconda3/envs/dpenv/python.exe', [pythonScriptPath]);
        let result = '';
        let error = '';

        pythonProcess.on('error', async (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT' && process.platform === 'win32') {
                // Retry with 'py' on Windows
                console.log('Retrying with py on Windows...');
                const pyProcess = spawn('py', [pythonScriptPath]);
                
                // Send data to Python script
                pyProcess.stdin.write(JSON.stringify(sprint_data));
                pyProcess.stdin.end();

                let pyResult = '';
                let pyError = '';

                pyProcess.stdout.on('data', (data) => pyResult += data.toString());
                pyProcess.stderr.on('data', (data) => pyError += data.toString());

                pyProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error('Python (py) execution failed:', pyError);
                        reject(new Error(`Python script execution failed: ${pyError}`));
                        return;
                    }
                    try {
                        console.log('Python output:', pyResult.trim());
                        resolve(JSON.parse(pyResult));
                    } catch (e) {
                        reject(new Error(`Failed to parse Python output: ${pyResult}`));
                    }
                });
                return;
            }
            reject(err);
        });

        // Send data to Python script
        pythonProcess.stdin.write(JSON.stringify(sprint_data));
        pythonProcess.stdin.end();

        // Collect results from Python script
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
            // Log stderr for debugging
            console.error('Python stderr:', error);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python execution failed:', error);
                reject(new Error(`Python script execution failed: ${error}`));
                return;
            }

            try {
                const prediction = JSON.parse(result);
                const success_score = prediction.predicted_success_score;
                
                // Determine risk level based on success score
                // High risk: < 40%
                // Medium risk: 40% - 75%
                // Low risk: > 75%
                let risk_level = "High";
                if (success_score > 0.75) {
                    risk_level = "Low";
                } else if (success_score >= 0.40) {
                    risk_level = "Medium";
                }

                resolve({
                    predicted_success_score: success_score,
                    confidence_interval: prediction.confidence_interval,
                    confidence_value: prediction.confidence_value,
                    risk_level,
                    message: getRiskMessage(risk_level, success_score, rawSprintData)
                });
            } catch (e) {
                reject(new Error('Failed to parse Python script output'));
            }
        });
    });
}

function getRiskMessage(risk_level: string, score: number, sprintData: any): string {
    const percentage = Math.round(score * 100);
    const items = sprintData.items ?? [];
    const total_backlog_items = Array.isArray(items) ? items.length : 0;
    const total_story_points = Array.isArray(items)
        ? items.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0)
        : 0;
    const completed_items = Array.isArray(items)
        ? items.filter((item: any) => String(item.status).toLowerCase() === 'done')
        : [];
    const completion_ratio = total_backlog_items > 0 ? completed_items.length / total_backlog_items : 0;
    const velocity_metric = sprintData.velocityMetrics?.[0];
    const workload = sprintData.workloadDistributions?.[0];

    // Build a detailed analysis
    const factors: string[] = [];

    // Analyze completion trend
    if (completion_ratio < 0.3) {
        factors.push("completion rate is significantly behind schedule");
    } else if (completion_ratio > 0.7) {
        factors.push("completion rate is ahead of schedule");
    }

    // Analyze velocity metrics
    if (velocity_metric?.efficiency) {
        if (velocity_metric.efficiency < 0.8) {
            factors.push("team velocity is below target");
        } else if (velocity_metric.efficiency > 1.2) {
            factors.push("team is exceeding velocity targets");
        }
    }

    // Analyze workload distribution
    if (workload?.efficiency) {
        if (workload.efficiency < 0.8) {
            factors.push("workload distribution needs optimization");
        } else if (workload.efficiency > 1.2) {
            factors.push("workload is well-distributed");
        }
    }

    // Check story point load
    const avgPointsPerDay = total_story_points / Math.max(1, sprintData.sprint_duration || 14);
    if (avgPointsPerDay > 8) {
        factors.push("story point load is higher than recommended");
    }

    // Build the message
    let baseMessage = '';
    switch (risk_level) {
        case 'Low':
            baseMessage = `Sprint is on track with ${percentage}% predicted success rate.`;
            break;
        case 'Medium':
            baseMessage = `Sprint has a ${percentage}% success prediction.`;
            break;
        case 'High':
            baseMessage = `Sprint success rate predicted at ${percentage}%.`;
            break;
        default:
            return 'Unable to determine sprint risk level.';
    }

    // Add factor analysis if we have any
    if (factors.length > 0) {
        baseMessage += ' Analysis shows ' + factors.join(', ') + '.';
    }

    // Add recommendation
    switch (risk_level) {
        case 'Low':
            baseMessage += ' Keep up the good work!';
            break;
        case 'Medium':
            baseMessage += ' Consider adjusting workload or reprioritizing tasks.';
            break;
        case 'High':
            baseMessage += ' Immediate action recommended to address risks.';
            break;
    }

    return baseMessage;
}

export async function POST(request: Request) {
    const body = await request.json();
    const sprintId = body.sprintId;
    const origin = request.headers.get('origin') || '*';

    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        // allow the client to send Authorization header
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (typeof sprintId !== 'number') {
        return NextResponse.json({ error: 'Invalid or missing sprintId' }, { status: 400, headers: corsHeaders });
    }

    try {
        // 1. Fetch RAW data required for feature generation from PostgreSQL/Prisma
        console.log('Fetching sprint data for ID:', sprintId);
        const rawSprintData = await (prisma as any).sprint.findUnique({
            where: { id: sprintId },
            include: {
                items: true, // Backlog items relation is named `items` in schema
                velocityMetrics: true,
                workloadDistributions: true,
                team: true,
            },
        });
        
        // Debug log ALL the fetched data
        console.log('=== DETAILED SPRINT DATA ===');
        console.log('Basic Sprint Info:', JSON.stringify({
            id: rawSprintData?.id,
            name: rawSprintData?.name,
            startDate: rawSprintData?.startDate,
            endDate: rawSprintData?.endDate,
            status: rawSprintData?.status,
            teamId: rawSprintData?.teamId,
        }, null, 2));
        
        // Calculate and log the exact features we're sending to the model
        const items = rawSprintData.items ?? [];
        const velocityMetric = (rawSprintData.velocityMetrics ?? [])[0];
        const workload = (rawSprintData.workloadDistributions ?? [])[0];
        
        const modelFeatures = {
            teamId: rawSprintData.teamId,
            sprint_duration: Math.ceil((new Date(rawSprintData.endDate).getTime() - new Date(rawSprintData.startDate).getTime()) / (1000 * 60 * 60 * 24)),
            total_backlog_items: items.length,
            total_story_points: items.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0),
            completion_ratio: items.filter((item: any) => String(item.status).toLowerCase() === 'done').length / Math.max(1, items.length),
            avg_priority: items.reduce((sum: number, item: any) => sum + (item.priority || 2), 0) / Math.max(1, items.length),
            avg_delay_minutes: velocityMetric?.averageDelay ?? 30.5,
            on_time_completion_ratio: velocityMetric?.onTimeRatio ?? 0.85,
            velocity_efficiency: velocityMetric?.efficiency ?? 1.1,
            workload_efficiency: workload?.efficiency ?? 1.05,
            task_density: items.length / Math.max(1, Math.ceil((new Date(rawSprintData.endDate).getTime() - new Date(rawSprintData.startDate).getTime()) / (1000 * 60 * 60 * 24))),
            team_experience: 3.8
        };
        
        console.log('\nModel Features:', JSON.stringify(modelFeatures, null, 2));
        
        console.log('\nBacklog Items:', JSON.stringify(rawSprintData?.items?.map((item: any) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            priority: item.priority,
            storyPoints: item.storyPoints,
        })), null, 2));
        
        console.log('\nVelocity Metrics:', JSON.stringify(rawSprintData?.velocityMetrics?.map((vm: any) => ({
            id: vm.id,
            averageDelay: vm.averageDelay,
            onTimeRatio: vm.onTimeRatio,
            efficiency: vm.efficiency,
        })), null, 2));
        
        console.log('\nWorkload Distributions:', JSON.stringify(rawSprintData?.workloadDistributions?.map((wd: any) => ({
            id: wd.id,
            efficiency: wd.efficiency,
        })), null, 2));
        
        console.log('\nTeam Info:', JSON.stringify(rawSprintData?.team ? {
            id: rawSprintData.team.id,
            name: rawSprintData.team.name,
        } : null, null, 2));
        console.log('=== END SPRINT DATA ===');

        if (!rawSprintData) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404, headers: corsHeaders });
        }

        // 2. Trigger the ML prediction service
        const predictionResult = await callMLService(rawSprintData);

        // 3. (Optional) Persist prediction to DB — skipped because schema has no prediction model
        // 4. Return the final structured response
        // Debug info about the data source
        const dataSourceInfo = {
            sprintFound: !!rawSprintData,
            itemCount: rawSprintData?.items?.length ?? 0,
            usingRealData: rawSprintData?.items?.length > 0 && !!rawSprintData.teamId,
            hasVelocityMetrics: Array.isArray(rawSprintData?.velocityMetrics) && rawSprintData.velocityMetrics.length > 0,
            hasWorkloadData: Array.isArray(rawSprintData?.workloadDistributions) && rawSprintData.workloadDistributions.length > 0
        };

        return NextResponse.json({
            sprintId: sprintId,
            predicted_success_score: predictionResult.predicted_success_score,
            confidence_interval: predictionResult.confidence_interval,
            confidence_value: predictionResult.confidence_value,
            risk_level: predictionResult.risk_level,
            message: predictionResult.message,
            debug: {
                ...dataSourceInfo,
                warning: !dataSourceInfo.usingRealData ? "Using fallback/mock data for prediction" : undefined
            }
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error(`Error processing prediction for sprint ${sprintId}:`, error);
        
        // In development, return more error details
        const errorResponse = process.env.NODE_ENV === 'development' 
            ? { 
                error: 'Internal Server Error during prediction',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
            : { error: 'Internal Server Error during prediction' };
            
        return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders });
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