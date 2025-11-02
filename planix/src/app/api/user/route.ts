import { NextResponse } from 'next/server';
import * as userService from '@/services/userService';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const users = await userService.getAllUsers();
    const response = NextResponse.json(users);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    return handleCors(response);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const user = await userService.createNewUser(data);
    const response = NextResponse.json(user, { status: 201 });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 400 });
    return handleCors(response);
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const user = await userService.updateExistingUser(id, data);
    const response = NextResponse.json(user);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to update user' }, { status: 400 });
    return handleCors(response);
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await userService.removeUser(id);
    const response = NextResponse.json({ message: 'User deleted' });
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to delete user' }, { status: 400 });
    return handleCors(response);
  }
}