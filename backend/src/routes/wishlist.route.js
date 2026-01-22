// fortunate/backend/src/routes/wishlist.route.js
import express from "express";
import wishlistController from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Tất cả các route yêu thích đều cần đăng nhập
router.use(authMiddleware);

router.post("/toggle", wishlistController.toggle);
router.get("/me", wishlistController.getMyWishlist); 

export default router;