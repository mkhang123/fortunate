import express from "express";
import { getProfile, getAllUsers, updateUserRole } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();
router.get("/me", authMiddleware, getProfile);
router.get("/all", authMiddleware, roleMiddleware("ADMIN"), getAllUsers);
router.put("/role/:id", authMiddleware, roleMiddleware("ADMIN"), updateUserRole);

export default router;