import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ message: 'Adaptive planning endpoint' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch adaptive data' }, { status: 500 });
  }
}