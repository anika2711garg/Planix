import { NextResponse } from 'next/server';
import * as notificationService from '@/services/notificationService';
import { handleCors, handleOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const notifications = await notificationService.getAllNotifications();
    const response = NextResponse.json(notifications);
    return handleCors(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    return handleCors(response);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const notification = await notificationService.createNewNotification(data);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create notification' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const notification = await notificationService.updateExistingNotification(id, data);
    return NextResponse.json(notification);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await notificationService.removeNotification(id);
    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 400 });
  }
}