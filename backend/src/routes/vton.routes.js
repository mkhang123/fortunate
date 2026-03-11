import express from 'express';
import vtonController from '../controllers/vton.controller.js';
import vtonConfigController from '../controllers/vton-config.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import { vtonUploadFields } from '../config/upload.config.js';

const router = express.Router();

// POST /api/vton/try-on - Thử đồ
router.post(
  '/try-on',
  authMiddleware,
  vtonUploadFields,
  vtonController.tryOn
);

// GET /api/vton/history - Lấy lịch sử
router.get(
  '/history',
  authMiddleware,
  vtonController.getHistory
);

// GET /api/vton/session/:id - Chi tiết session
router.get(
  '/session/:id',
  authMiddleware,
  vtonController.getSessionById
);

// DELETE /api/vton/session/:id - Xóa session
router.delete(
  '/session/:id',
  authMiddleware,
  vtonController.deleteSession
);

// GET /api/vton/config - Lấy config VTON (admin)
router.get(
  '/config',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  vtonConfigController.getConfig
);

// PUT /api/vton/config - Cập nhật Colab URL (admin)
router.put(
  '/config',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  vtonConfigController.updateColabUrl
);

export default router;
