import express from 'express';
import vtonController from '../controllers/vton.controller.js';
import vtonConfigController from '../controllers/vton-config.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';
import { uploadVtonImages } from '../config/cloudinary.config.js';

const router = express.Router();
router.post(
  '/try-on',
  authMiddleware,
  uploadVtonImages,
  vtonController.tryOn
);
router.get(
  '/history',
  authMiddleware,
  vtonController.getHistory
);
router.get(
  '/session/:id',
  authMiddleware,
  vtonController.getSessionById
);
router.delete(
  '/session/:id',
  authMiddleware,
  vtonController.deleteSession
);
router.get(
  '/config',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  vtonConfigController.getConfig
);
router.put(
  '/config',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  vtonConfigController.updateColabUrl
);

export default router;
