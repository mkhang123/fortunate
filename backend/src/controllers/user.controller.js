
import userService from "../services/user.service.js";
import { deleteFromCloudinary } from "../config/cloudinary.config.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getProfile(userId);

    res.json({ success: true, data: user });
  } catch (error) {
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
export const updateUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive phải là boolean" });
    }

    const result = await userService.setUserActive(id, isActive);
    res.json({
      success: true,
      message: isActive ? "Đã mở chặn người dùng" : "Đã chặn người dùng",
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body; // Lấy name, phone, address từ request body
    const updated = await userService.updateProfile(userId, { name, phone, address });
    res.json({ success: true, message: "Cập nhật thông tin thành công", data: updated });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
export const updateBodyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { height, weight, chest, waist, hip } = req.body;
    const result = await userService.updateBodyProfile(userId, { height, weight, chest, waist, hip });
    res.json({ success: true, message: "Cập nhật số đo thành công", data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh đại diện" });
    }

    const userId = req.user.id;
    const avatarUrl = req.file.path;       // Cloudinary secure URL
    const avatarPublicId = req.file.filename; // Cloudinary public_id
    const currentUser = await userService.getProfile(userId);
    if (currentUser.avatar && currentUser.avatar.includes('cloudinary.com')) {
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
