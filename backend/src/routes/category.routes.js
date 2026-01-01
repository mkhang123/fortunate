import express from "express";
import categoryController from "../controllers/category.controller.js";

const router = express.Router();

// Định nghĩa đường dẫn lấy danh sách
router.get("/", categoryController.getAll);

export default router;