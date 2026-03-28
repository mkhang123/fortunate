import express from "express";
import brandController from "../controllers/brand.controller.js";

const router = express.Router();

// Public — người dùng có thể xem danh sách thương hiệu
router.get("/", brandController.getAll);

export default router;

