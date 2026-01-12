// fortunate/backend/src/controllers/user.controller.js
import userService from "../services/user.service.js"; // Đổi từ repository sang service

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

