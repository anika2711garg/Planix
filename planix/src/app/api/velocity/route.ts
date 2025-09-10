import { NextResponse } from 'next/server';
import * as velocityService from '@/services/velocityService';

export async function GET() {
  try {
    const metrics = await velocityService.getAllVelocityMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch velocity metrics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const metric = await velocityService.createNewVelocityMetric(data);
    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create velocity metric' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const metric = await velocityService.updateExistingVelocityMetric(id, data);
    return NextResponse.json(metric);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update velocity metric' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await velocityService.removeVelocityMetric(id);
    return NextResponse.json({ message: 'Velocity metric deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete velocity metric' }, { status: 400 });
  }
}