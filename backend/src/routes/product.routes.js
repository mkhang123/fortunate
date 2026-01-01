import express from "express";
import productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", productController.getAll);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "CREATOR"]),
  productController.create
);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), productController.delete);
router.get("/featured", productController.getFeatured);

export default router;
