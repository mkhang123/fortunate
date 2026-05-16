import express from "express";
import OrderController from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();
router.use(authMiddleware);
router.post("/", asyncHandler(OrderController.createOrder));
router.get("/me", asyncHandler(OrderController.getUserOrders));
router.get("/all", roleMiddleware(["ADMIN"]), asyncHandler(OrderController.getAllOrders));
router.get("/:id/invoice", asyncHandler(OrderController.downloadInvoice));
router.get("/:id", asyncHandler(OrderController.getOrderById));
router.patch(
    "/:id/status",
    roleMiddleware(["ADMIN"]),
    asyncHandler(OrderController.updateOrderStatus)
);
router.delete("/:id", roleMiddleware(["ADMIN"]), asyncHandler(OrderController.deleteOrder));

export default router;
