import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ message: 'Performance data endpoint' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}