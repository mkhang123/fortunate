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

router.get("/me", authMiddleware, getProfile);

router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);

router.put("/role/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserRole);

router.put("/active/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserActive);

router.put("/me", authMiddleware, updateProfile);

router.put("/me/body-profile", authMiddleware, updateBodyProfile);

router.post("/me/avatar", authMiddleware, uploadAvatar.single("avatar"), updateAvatar);

export default router;
