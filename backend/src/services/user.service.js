import userRepository from "../repositories/user.repository.js";

class UserService {
  async getProfile(userId) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng");
      error.statusCode = 404;
      throw error;
    }

    // Cách xóa password an toàn và hiệu quả nhất
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async listAllUsers() {
    return await userRepository.findAllUsers();
  }

  async changeUserRole(userId, newRole) {
    // Kiểm tra User có tồn tại không trước khi đổi role
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại");
      error.statusCode = 404;
      throw error;
    }

    // Thực hiện cập nhật role qua repository
    return await userRepository.updateRole(userId, newRole);
  }
}

export default new UserService();
