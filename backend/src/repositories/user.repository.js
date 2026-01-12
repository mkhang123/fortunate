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
}

export default new UserRepository();
