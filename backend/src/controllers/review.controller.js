import reviewService from '../services/review.service.js';

class ReviewController {
    async getReviews(req, res) {
        try {
            const { productId } = req.params;
            const data = await reviewService.getProductReviews(productId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
    async checkEligibility(req, res) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;
            const data = await reviewService.checkReviewEligibility(userId, productId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
    async createReview(req, res) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;
            const { rating, comment } = req.body;
            const images = Array.isArray(req.files)
                ? req.files.map((file) => file.path).filter(Boolean)
                : [];

            const review = await reviewService.createReview(userId, productId, { rating, comment, images });
            return res.status(201).json({ success: true, data: review, message: 'Đánh giá đã được gửi' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
}

export default new ReviewController();
