import * as userModel from "@/models/user";

export async function getAllUsers() {
  return await userModel.getUsers();
}

export async function createNewUser(data: any) {
  const userData = {
    username: data.name,
    email: data.email,
    role: data.role,
    teamId: data.teamId
  };
  return await userModel.createUser(userData);
}

export async function updateExistingUser(id: number, data: any) {
  const updateData = { ...data };
  if (data.name) {
    updateData.username = data.name;
    delete updateData.name;
  }
  return await userModel.updateUser(id, updateData);
}

export async function removeUser(id: number) {
  return await userModel.deleteUser(id);
}
