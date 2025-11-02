import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  error?: string;
}

// Verify JWT token and return user data
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    if (!decoded.userId) {
      return { success: false, error: 'Invalid token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

export function createAuthResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Helper function to check if user has manager role
export function isManager(role: string): boolean {
  return role === 'manager';
}

// Helper function to check if user can perform CRUD operations
export function canWrite(role: string): boolean {
  return role === 'manager' || role === 'leader';
}

// Helper function to check if user has read-only access
export function canRead(role: string): boolean {
  return ['manager', 'leader', 'developer'].includes(role);
}

// Check permissions for API routes
export function checkPermissions(userRole: string, operation: 'read' | 'write'): boolean {
  if (operation === 'read') {
    return canRead(userRole);
  }
  if (operation === 'write') {
    return canWrite(userRole);
  }
  return false;
}