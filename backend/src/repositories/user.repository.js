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

  // Cập nhật thông tin cơ bản: name, phone
  async updateProfile(userId, data) {
    const id = Number(userId);
    return await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, phone: true, email: true },
    });
  }

  // Tạo mới hoặc cập nhật số đo cơ thể (upsert)
  async upsertBodyProfile(userId, data) {
    const id = Number(userId);
    return await prisma.userBodyProfile.upsert({
      where: { userId: id },
      // Nếu chưa có record -> tạo mới
      create: { userId: id, ...data },
      // Nếu đã có -> cập nhật
      update: { ...data },
    });
  }
}

export default new UserRepository();
