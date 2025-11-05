import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    const origin = request.headers.get('origin') || '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    try {
        const body = await request.json();
        const { sprintId } = body;

        if (!sprintId) {
            return NextResponse.json(
                { error: 'sprintId is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        console.log('Fetching sprint data for ID:', sprintId);
        
        // Fetch sprint data from database
        const sprint = await prisma.sprint.findUnique({
            where: { id: sprintId },
            include: {
                items: true,
            },
        });
        
        console.log('Sprint data fetched:', {
            id: sprint?.id,
            startDate: sprint?.startDate,
            endDate: sprint?.endDate,
            itemCount: sprint?.items?.length
        });

        if (!sprint) {
            return NextResponse.json(
                { error: 'Sprint not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Calculate sprint duration in days
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const sprintDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate total story points
        const totalPoints = sprint.items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);

        // Calculate remaining points per day based on completed items
        const today = new Date();
        const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const actuals: number[] = [];

        for (let day = 0; day <= Math.min(daysSinceStart, sprintDays); day++) {
            const dateToCheck = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
            const remainingPoints = sprint.items.reduce((sum, item) => {
                // If item is not done by this date, include its points
                const itemStatus = (item.status || '').toLowerCase();
                const isCompleted = itemStatus === 'done' || itemStatus === 'completed';
                const storyPoints = typeof item.storyPoints === 'number' ? item.storyPoints : 0;
                
                // Add points to sum if not completed
                if (!isCompleted) {
                    return sum + storyPoints;
                }
                return sum;
            }, 0);
            
            console.log(`Day ${day}: Remaining points = ${remainingPoints}`);
            actuals.push(remainingPoints);
        }

        // Prepare input for Python script
        const scriptInput = {
            total_points: totalPoints,
            sprint_days: sprintDays,
            actuals: actuals,
        };

        // Get path to Python script
        const pythonScriptPath = path.join(process.cwd(), 'src', 'services', 'time_series_forecast.py');

        return new Promise((resolve, reject) => {
            // Use the configured Python path
            const pythonProcess = spawn('E:/Anaconda3/envs/dpenv/python.exe', [pythonScriptPath]);
            let result = '';
            let error = '';

            pythonProcess.on('error', (err) => {
                console.error('Failed to start Python process:', err);
                reject(err);
            });

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
                // Log stderr but don't fail - it might be just informational
                console.log('Python stderr:', data.toString());
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python process exited with code', code);
                    console.error('Error output:', error);
                    resolve(NextResponse.json(
                        { error: 'Forecast calculation failed' },
                        { status: 500, headers: corsHeaders }
                    ));
                    return;
                }

                try {
                    const forecast = JSON.parse(result);
                    resolve(NextResponse.json(forecast, { status: 200, headers: corsHeaders }));
                } catch (e) {
                    console.error('Failed to parse Python output:', e);
                    resolve(NextResponse.json(
                        { error: 'Invalid forecast data' },
                        { status: 500, headers: corsHeaders }
                    ));
                }
            });

            console.log('Sending data to Python script:', JSON.stringify(scriptInput, null, 2));
            
            // Send input data to Python script
            pythonProcess.stdin.write(JSON.stringify(scriptInput));
            pythonProcess.stdin.end();
        });
    } catch (error) {
        console.error('Error in time series forecast:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Handle CORS preflight
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
