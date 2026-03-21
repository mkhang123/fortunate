import express from "express";
import {
  getProfile,
  getAllUsers,
  updateUserRole,
  updateUserActive,
  updateProfile,
  updateBodyProfile,
  updateAvatar,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { uploadAvatar } from "../config/cloudinary.config.js";

const router = express.Router();

// Lấy thông tin bản thân
router.get("/me", authMiddleware, getProfile);

// Admin: lấy tất cả user
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);

// Admin: thay đổi role user
router.put("/role/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserRole);

// Admin: chặn/mở chặn user
router.put("/active/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserActive);

// Cập nhật thông tin cơ bản (name, phone)
router.put("/me", authMiddleware, updateProfile);

// Cập nhật số đo cơ thể
router.put("/me/body-profile", authMiddleware, updateBodyProfile);

// Cập nhật avatar - upload ảnh lên Cloudinary
router.post("/me/avatar", authMiddleware, uploadAvatar.single("avatar"), updateAvatar);

export default router;
