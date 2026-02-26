import express from "express";
import { getProfile, getAllUsers, updateUserRole, updateProfile, updateBodyProfile } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();
router.get("/me", authMiddleware, getProfile);
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);
router.put("/role/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserRole);
// Route cập nhật thông tin cơ bản (name, phone) của user đang đăng nhập
router.put("/me", authMiddleware, updateProfile);
// Route cập nhật số đo cơ thể của user đang đăng nhập
router.put("/me/body-profile", authMiddleware, updateBodyProfile);

export default router;
