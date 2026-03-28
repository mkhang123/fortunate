import express from "express";
import OrderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

// Guest endpoints (no auth required)
router.post("/guest", asyncHandler(OrderController.createGuestOrder));
router.get("/guest/:id", asyncHandler(OrderController.getGuestOrderById));

// All remaining order routes require authentication
router.use(authMiddleware);

// User endpoints - order matters! /me must come before /:id
router.post("/", asyncHandler(OrderController.createOrder));
router.get("/me", asyncHandler(OrderController.getUserOrders));

// Admin endpoints
router.get("/all", roleMiddleware(["ADMIN"]), asyncHandler(OrderController.getAllOrders));

// This must come after /me and /all to avoid conflicts
router.get("/:id", asyncHandler(OrderController.getOrderById));
router.patch(
    "/:id/status",
    roleMiddleware(["ADMIN"]),
    asyncHandler(OrderController.updateOrderStatus)
);
router.delete("/:id", roleMiddleware(["ADMIN"]), asyncHandler(OrderController.deleteOrder));

export default router;
