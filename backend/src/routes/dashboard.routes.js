import express from "express";
import DashboardController from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// Tất cả route dashboard chỉ dành cho ADMIN
router.use(authMiddleware);
router.use(roleMiddleware(["ADMIN"]));

// GET /api/admin/dashboard
router.get("/", asyncHandler(DashboardController.getDashboard));

export default router;
