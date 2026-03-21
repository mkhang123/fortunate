import { Router } from "express";
import { handleChat } from "../controllers/chat.controller.js";

const router = Router();

// ─── POST /api/chat ─── Streaming via SSE (RAG Architecture) ─────────────────
router.post("/", handleChat);

export default router;
