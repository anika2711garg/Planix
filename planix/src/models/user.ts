import { prisma } from '@/lib/prisma';

export async function getUsers() {
  return await prisma.user.findMany({ include: { team: true } });
}

export async function createUser(data: { username: string; email: string; role: string; teamId?: number }) {
  return await prisma.user.create({ data });
}

export async function updateUser(id: number, data: Partial<{ username: string; email: string; role: string; teamId?: number }>) {
  return await prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: number) {
  return await prisma.user.delete({ where: { id } });
}