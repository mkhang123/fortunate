import userRepository from "../repositories/user.repository.js";

class UserService {
  async getProfile(userId) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Không tìm thấy người dùng");
      error.statusCode = 404;
      throw error;
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async listAllUsers() {
    return await userRepository.findAllUsers();
  }

  async changeUserRole(userId, newRole) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    return await userRepository.updateRole(userId, newRole);
  }
  async setUserActive(userId, isActive) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    if (user.role !== "USER") {
      const error = new Error("Chỉ có thể chặn người dùng có role USER");
      error.statusCode = 403;
      throw error;
    }

    return await userRepository.updateActive(userId, isActive);
  }
  async updateProfile(userId, { name, phone, address }) {
    if (!name || name.trim() === "") {
      const error = new Error("Tên không được để trống");
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await userRepository.updateProfile(userId, {
      name: name.trim(),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    });
    return updatedUser;
  }
  async updateBodyProfile(userId, data) {
    const { height, weight, chest, waist, hip } = data;
    const fields = { height, weight, chest, waist, hip };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined && (isNaN(val) || Number(val) <= 0)) {
        const error = new Error(`Giá trị ${key} phải là số dương`);
        error.statusCode = 400;
        throw error;
      }
    }
    const parsedData = Object.fromEntries(
      Object.entries(fields)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, parseFloat(v)])
    );

    return await userRepository.upsertBodyProfile(userId, parsedData);
  }
  async updateAvatar(userId, avatarUrl) {
    if (!avatarUrl) {
      const error = new Error("URL ảnh đại diện không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return await userRepository.updateAvatar(userId, avatarUrl);
  }
}

export default new UserService();
