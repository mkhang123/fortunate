
import express from "express";
import wishlistController from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/toggle", wishlistController.toggle);
router.get("/me", wishlistController.getMyWishlist); 

export default router;