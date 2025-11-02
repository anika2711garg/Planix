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
    const { username, email, password, role } = await request.json();

    // Validation
    if (!username || !email || !password) {
      const response = NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
      return handleCors(response);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      const response = NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
      return handleCors(response);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'developer', // Default to developer role
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Create JWT token for immediate login
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

    const response = NextResponse.json(
      { 
        message: 'User created successfully', 
        user,
        token 
      },
      { status: 201 }
    );
    return handleCors(response);

  } catch (error) {
    console.error('Signup error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return handleCors(response);
  }
}