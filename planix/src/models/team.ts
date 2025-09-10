import { prisma } from '@/lib/prisma';

export async function getTeams() {
  return await prisma.team.findMany({ include: { members: true, sprints: true } });
}

export async function createTeam(data: { name: string }) {
  return await prisma.team.create({ data });
}

export async function updateTeam(id: number, data: Partial<{ name: string }>) {
  return await prisma.team.update({ where: { id }, data });
}

export async function deleteTeam(id: number) {
  return await prisma.team.delete({ where: { id } });
}