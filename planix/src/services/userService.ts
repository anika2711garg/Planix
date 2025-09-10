import * as userModel from '@/models/user';
import bcrypt from 'bcrypt';

export async function getAllUsers() {
  try {
    return await userModel.getUsers();
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createNewUser(data: { username: string; email: string; role: string; password: string; teamId?: number }) {
  try {
    if (!data.username || !data.email || !data.role || !data.password) {
      throw new Error("All fields (username, email, role, password) are required");
    }
    if (!['manager', 'developer', 'leader'].includes(data.role)) {
      throw new Error('Invalid role. Must be "manager", "developer", or "leader"');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await userModel.createUser({ ...data, password: hashedPassword });
  } catch (error) {
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateExistingUser(id: number, data: Partial<{ username?: string; email?: string; role?: string; teamId?: number }>) {
  try {
    // Prevent password updates through this function (handle separately if needed)
    if ('password' in data) {
      throw new Error("Password cannot be updated using this method. Use a dedicated password reset function.");
    }
    if (data.role && !['manager', 'developer', 'leader'].includes(data.role)) {
      throw new Error('Invalid role. Must be "manager", "developer", or "leader"');
    }
    return await userModel.updateUser(id, data);
  } catch (error) {
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeUser(id: number) {
  try {
    return await userModel.deleteUser(id);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}