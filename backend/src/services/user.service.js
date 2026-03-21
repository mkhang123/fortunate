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

  // Admin: chặn/mở chặn user theo cờ isActive
  async setUserActive(userId, isActive) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) {
      const error = new Error("Người dùng không tồn tại");
      error.statusCode = 404;
      throw error;
    }

    // Chỉ chặn tài khoản role USER theo yêu cầu
    if (user.role !== "USER") {
      const error = new Error("Chỉ có thể chặn người dùng có role USER");
      error.statusCode = 403;
      throw error;
    }

    return await userRepository.updateActive(userId, isActive);
  }

  // Cập nhật thông tin cơ bản (name, phone)
  async updateProfile(userId, { name, phone }) {
    // name không được để rỗng
    if (!name || name.trim() === "") {
      const error = new Error("Tên không được để trống");
      error.statusCode = 400;
      throw error;
    }

    const updatedUser = await userRepository.updateProfile(userId, {
      name: name.trim(),
      // Chỉ cập nhật phone nếu có gửi lên
      ...(phone !== undefined && { phone }),
    });
    return updatedUser;
  }

  // Cập nhật số đo cơ thể
  async updateBodyProfile(userId, data) {
    const { height, weight, chest, waist, hip } = data;
    const fields = { height, weight, chest, waist, hip };

    // Kiểm tra: tất cả các số phải > 0
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined && (isNaN(val) || Number(val) <= 0)) {
        const error = new Error(`Giá trị ${key} phải là số dương`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Chuyển sang số thực trước khi lưu
    const parsedData = Object.fromEntries(
      Object.entries(fields)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, parseFloat(v)])
    );

    return await userRepository.upsertBodyProfile(userId, parsedData);
  }

  // Cập nhật avatar của user
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
