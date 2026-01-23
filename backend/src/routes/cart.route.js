// fortunate/backend/src/routes/cart.route.js
import express from "express";
import cartController from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware); // Giỏ hàng bắt buộc đăng nhập

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.delete("/item/:itemId", cartController.deleteItem);
router.patch("/item/:itemId", cartController.updateQuantity);

export default router;