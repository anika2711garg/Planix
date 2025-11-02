import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      const response = NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
      return handleCors(response);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        role: true,
      }
    });

    if (!user || !user.password) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return handleCors(response);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return handleCors(response);
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
    return handleCors(response);

  } catch (error) {
    console.error('Signin error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return handleCors(response);
  }
}