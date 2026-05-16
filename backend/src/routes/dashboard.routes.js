import express from "express";
import DashboardController from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();
router.use(authMiddleware);
router.use(roleMiddleware(["ADMIN"]));
router.get("/", asyncHandler(DashboardController.getDashboard));
router.get("/vton-sessions", asyncHandler(DashboardController.getVtonSessions));

export default router;
