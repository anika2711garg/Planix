import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers }
      );
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400, headers }
      );
    }

    // Get team with members
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404, headers }
      );
    }

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        members: team.members
      }
    }, { headers });

  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers }
      );
    }

    // Only managers can add users to teams
    if (authResult.user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can add users to teams' },
        { status: 403, headers }
      );
    }

    const body = await req.json();
    const { teamId, userId } = body;

    if (!teamId || !userId) {
      return NextResponse.json(
        { error: 'Team ID and User ID are required' },
        { status: 400, headers }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404, headers }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers }
      );
    }

    // Check if user is already in a team
    if (user.teamId) {
      return NextResponse.json(
        { error: 'User is already assigned to a team' },
        { status: 400, headers }
      );
    }

    // Add user to team
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId: teamId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        teamId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User added to team successfully',
      user: updatedUser
    }, { status: 201, headers });

  } catch (error) {
    console.error('Add user to team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const authResult = await verifyAuth(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers }
      );
    }

    // Only managers can remove users from teams
    if (authResult.user.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can remove users from teams' },
        { status: 403, headers }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers }
      );
    }

    // Remove user from team
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        teamId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User removed from team successfully',
      user: updatedUser
    }, { headers });

  } catch (error) {
    console.error('Remove user from team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}