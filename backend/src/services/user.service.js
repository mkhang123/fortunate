import userRepository from "../repositories/user.repository.js";

class UserService {
  async getProfile(userId) {
    try {
      const user = await userRepository.getUserProfile(userId);
      if (!user) {
        const error = new Error("Không tìm thấy người dùng");
        error.statusCode = 404;
        throw error;
      }
      // Bạn có thể xóa password trước khi trả về để bảo mật
      delete user.password;
      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();