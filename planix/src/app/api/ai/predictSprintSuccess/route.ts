// /src/app/api/ai/predictSprintSuccess/route.ts
// NEXT.JS APP ROUTER API ENDPOINT

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// NOTE: The actual ML model inference runs in a separate Python process or service.
// This is a placeholder for the communication/execution layer.
// In production, consider using a queue (e.g., Redis/RabbitMQ) or a FastAPI microservice.

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper function to simulate the feature engineering and ML prediction call
// In a real setup, this would be an async HTTP request to a dedicated Python ML service.
async function callMLService(rawSprintData: any): Promise<{
    predicted_success_score: number;
    confidence_interval: [number, number];
    confidence_value: number;
}> {
    // 1. **Feature Generation Logic (Simplified):**
    // In the real system, you would pass the raw data fetched by Prisma to the
    // Python script, which then calculates ALL features (e.g., completion_ratio, task_density).
    
    // 2. **Execute Python Script (Simulated):**
    // Execution example (requires setup like edge function or child process):
    // const pythonResult = await run_python_script('predict_sprint_success.py', { features: computedFeatures });

    // Mock ML output
    const score = parseFloat((Math.random() * 0.2 + 0.7).toFixed(2)); // Between 0.70 and 0.90
    const lower = score - 0.06;
    const upper = score + 0.05;

    return {
        predicted_success_score: score,
        confidence_interval: [lower, upper],
        confidence_value: upper - lower,
    };
}


export async function POST(request: Request) {
  const body = await request.json();
  const sprintId = body.sprintId;

  if (typeof sprintId !== 'number') {
    return NextResponse.json({ error: 'Invalid or missing sprintId' }, { status: 400 });
  }

  try {
    // 1. Fetch RAW data required for feature generation from PostgreSQL/Prisma
    // We fetch enough relations to compute ALL required features (e.g., total_story_points, delay info).
    const rawSprintData = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        backlogItems: true, // For total_story_points, priority
        velocityMetric: true, // For averagePoints
        delayHistory: true, // For avg_delay_ratio
        workloadDistribution: true, // For workload_efficiency
        // You'd need a more complex query to aggregate task completion and user data
      },
    });

    if (!rawSprintData) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // 2. Trigger the ML prediction service
    const predictionResult = await callMLService(rawSprintData); // Passes raw data to the ML function

    // 3. Store the prediction result in the database
    const predictionRecord = await prisma.sprintSuccessPrediction.create({
      data: {
        sprintId: sprintId,
        predictedScore: predictionResult.predicted_success_score,
        // Store the range (upper bound - lower bound) as a proxy for confidence
        confidence: predictionResult.confidence_value, 
      },
    });

    // 4. Return the final structured response
    return NextResponse.json({
      sprintId: sprintId,
      predicted_success_score: predictionResult.predicted_success_score,
      confidence_interval: predictionResult.confidence_interval,
    });

  } catch (error) {
    console.error(`Error processing prediction for sprint ${sprintId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error during prediction' }, { status: 500 });
  }
}