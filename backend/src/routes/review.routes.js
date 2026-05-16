import express from 'express';
import reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadProductImage } from '../config/cloudinary.config.js';

const router = express.Router({ mergeParams: true }); // mergeParams để nhận productId từ parent route
router.get('/', reviewController.getReviews.bind(reviewController));
router.get('/eligibility', authMiddleware, reviewController.checkEligibility.bind(reviewController));
router.post(
  '/',
  authMiddleware,
  uploadProductImage.array('images', 5),
  reviewController.createReview.bind(reviewController)
);

export default router;
