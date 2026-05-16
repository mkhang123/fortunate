import { Router } from "express";
import { handleChat } from "../controllers/chat.controller.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuth.middleware.js";

const router = Router();

router.post("/", optionalAuthMiddleware, handleChat);

export default router;
