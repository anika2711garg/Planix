import { NextResponse } from 'next/server';
import * as velocityService from '@/services/velocityService';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const metrics = await velocityService.getAllVelocityMetrics();
    const response = NextResponse.json(metrics);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to fetch velocity metrics' }, { status: 500 });
    return handleCors(response);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const metric = await velocityService.createNewVelocityMetric(data);
    const response = NextResponse.json(metric, { status: 201 });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create velocity metric' }, { status: 400 });
    return handleCors(response);
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const metric = await velocityService.updateExistingVelocityMetric(id, data);
    const response = NextResponse.json(metric);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to update velocity metric' }, { status: 400 });
    return handleCors(response);
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await velocityService.removeVelocityMetric(id);
    const response = NextResponse.json({ message: 'Velocity metric deleted' });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to delete velocity metric' }, { status: 400 });
    return handleCors(response);
  }
}