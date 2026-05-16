import express from "express";
import categoryController from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();
router.get("/", categoryController.getAll);
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.create);
router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.delete);

export default router;