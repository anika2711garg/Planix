import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
      return handleCors(response);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      // Fetch fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId || decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      if (!user) {
        const response = NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
        return handleCors(response);
      }

      const response = NextResponse.json(user);
      return handleCors(response);

    } catch (jwtError) {
      const response = NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
      return handleCors(response);
    }

  } catch (error) {
    console.error('Me endpoint error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return handleCors(response);
  }
}