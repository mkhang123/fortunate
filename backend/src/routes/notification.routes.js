import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/notifications — lấy thông báo + đếm chưa đọc
router.get('/', authMiddleware, getNotifications);

// PATCH /api/notifications/read-all — đánh dấu tất cả đã đọc
// (phải đặt TRƯỚC /:id để không bị match nhầm)
router.patch('/read-all', authMiddleware, markAllAsRead);

// PATCH /api/notifications/:id/read — đánh dấu 1 thông báo đã đọc
router.patch('/:id/read', authMiddleware, markAsRead);

export default router;
