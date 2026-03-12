// fortunate/backend/src/controllers/user.controller.js
import userService from "../services/user.service.js";
import { deleteFromCloudinary } from "../config/cloudinary.config.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Gọi qua service để lấy dữ liệu đã được xử lý (ví dụ: đã xóa password)
    const user = await userService.getProfile(userId);

    res.json({ success: true, data: user });
  } catch (error) {
    // Trả về mã lỗi từ service hoặc 500 nếu lỗi server
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lỗi server"
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.listAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params; // ID của user cần sửa
    const { role } = req.body;  // Role mới: "ADMIN", "CREATOR", "USER"

    const result = await userService.changeUserRole(id, role);

    res.json({
      success: true,
      message: `Đã chuyển thành công người dùng sang quyền ${role}`,
      data: result
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin cơ bản: name, phone
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body; // Lấy name và phone từ request body
    const updated = await userService.updateProfile(userId, { name, phone });
    res.json({ success: true, message: "Cập nhật thông tin thành công", data: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// Cập nhật số đo cơ thể
export const updateBodyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy tất cả các trường số đo từ body
    const { height, weight, chest, waist, hip } = req.body;
    const result = await userService.updateBodyProfile(userId, { height, weight, chest, waist, hip });
    res.json({ success: true, message: "Cập nhật số đo thành công", data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// Cập nhật avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh đại diện" });
    }

    const userId = req.user.id;
    const avatarUrl = req.file.path;       // Cloudinary secure URL
    const avatarPublicId = req.file.filename; // Cloudinary public_id

    // Nếu user đã có avatar cũ → xóa trên Cloudinary để tiết kiệm dung lượng
    const currentUser = await userService.getProfile(userId);
    if (currentUser.avatar && currentUser.avatar.includes('cloudinary.com')) {
      // Trích xuất public_id từ URL cũ
      // URL dạng: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<public_id>.ext
      const urlParts = currentUser.avatar.split('/');
      const fileWithExt = urlParts[urlParts.length - 1];
      const oldPublicId = `fortunate/avatars/${fileWithExt.split('.')[0]}`;
      await deleteFromCloudinary(oldPublicId);
    }

    const updated = await userService.updateAvatar(userId, avatarUrl);
    res.json({
      success: true,
      message: "Cập nhật ảnh đại diện thành công",
      data: updated,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
