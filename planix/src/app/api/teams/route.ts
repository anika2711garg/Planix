import { NextResponse } from 'next/server';
import * as teamService from '@/services/teamService';

export async function GET() {
  try {
    const teams = await teamService.getAllTeams();
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const team = await teamService.createNewTeam(data);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create team' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const team = await teamService.updateExistingTeam(id, data);
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await teamService.removeTeam(id);
    return NextResponse.json({ message: 'Team deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 400 });
  }
}