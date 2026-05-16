import express from "express";
import brandController from "../controllers/brand.controller.js";

const router = express.Router();

router.get("/", brandController.getAll);

export default router;

