import express from "express";
import PaymentController from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public endpoints (no auth required)
router.get("/vnpay_return", PaymentController.handleVNPayReturn);
router.get("/vnpay_ipn", PaymentController.handleVNPayIPN);

// Protected endpoints (auth required)
router.get("/methods", authMiddleware, PaymentController.getPaymentMethods);
router.get("/statuses", authMiddleware, PaymentController.getPaymentStatuses);
router.post(
    "/vnpay/create",
    PaymentController.createPaymentUrlToVNPay
);
router.get(
    "/order/:orderId",
    authMiddleware,
    PaymentController.queryPaymentStatus
);

export default router;
