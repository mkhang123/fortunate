import express from "express";
import productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/featured", productController.getFeatured);
router.get("/", productController.getAll);
router.get("/:slug", productController.getBySlug);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "CREATOR"]),
  productController.create
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "CREATOR"]),
  productController.delete
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "CREATOR"]),
  productController.update
);

export default router;
