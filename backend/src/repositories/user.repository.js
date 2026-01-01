import prisma from "../config/prisma.js";

class UserRepository {
  async getUserProfile(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bodyProfile: true, // Lấy kèm số đo cơ thể từ bảng BodyProfile
      }
    });
  }
}
export default new UserRepository();