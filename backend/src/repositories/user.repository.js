import prisma from "../config/prisma.js";

class UserRepository {
  async getUserProfile(userId) {
    const id = Number(userId);
    if (isNaN(id)) return null;

    return await prisma.user.findUnique({
      where: { id },
      include: {
        bodyProfile: true,
      },
    });
  }

  async findAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateRole(userId, role) {
    const id = Number(userId);
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true },
    });
  }
  async updateActive(userId, isActive) {
    const id = Number(userId);
    return await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }
  async updateProfile(userId, data) {
    const id = Number(userId);
    return await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, phone: true, address: true, email: true },
    });
  }
  async upsertBodyProfile(userId, data) {
    const id = Number(userId);
    return await prisma.userBodyProfile.upsert({
      where: { userId: id },
      create: { userId: id, ...data },
      update: { ...data },
    });
  }
  async updateAvatar(userId, avatarUrl) {
    const id = Number(userId);
    return await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, avatar: true },
    });
  }
}

export default new UserRepository();
