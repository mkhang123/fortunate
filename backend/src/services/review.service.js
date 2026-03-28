import reviewRepository from '../repositories/review.repository.js';

class ReviewService {
    // Lấy tất cả đánh giá của sản phẩm + thống kê
    async getProductReviews(productId) {
        const reviews = await reviewRepository.getByProductId(productId);

        const totalReviews = reviews.length;
        const avgRating =
            totalReviews > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;

        // Đếm số lượng mỗi sao (1-5)
        const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
            if (ratingBreakdown[r.rating] !== undefined) ratingBreakdown[r.rating]++;
        });

        return { reviews, totalReviews, avgRating: Math.round(avgRating * 10) / 10, ratingBreakdown };
    }

    // Kiểm tra quyền đánh giá của user
    async checkReviewEligibility(userId, productId) {
        const hasPurchased = await reviewRepository.hasPurchased(userId, productId);
        const existingReview = await reviewRepository.findExisting(userId, productId);
        return { canReview: hasPurchased && !existingReview, hasPurchased, hasReviewed: !!existingReview };
    }

    // Tạo đánh giá mới
    async createReview(userId, productId, { rating, comment, images = [] }) {
        if (!rating || rating < 1 || rating > 5) {
            const err = new Error('Rating phải từ 1 đến 5 sao');
            err.statusCode = 400;
            throw err;
        }

        const existing = await reviewRepository.findExisting(userId, productId);
        if (existing) {
            const err = new Error('Bạn đã đánh giá sản phẩm này rồi');
            err.statusCode = 409;
            throw err;
        }

        const hasPurchased = await reviewRepository.hasPurchased(userId, productId);
        if (!hasPurchased) {
            const err = new Error('Bạn cần mua sản phẩm này trước khi đánh giá');
            err.statusCode = 403;
            throw err;
        }

        return await reviewRepository.create({
            userId,
            productId,
            rating,
            comment,
            images,
            verifiedPurchase: true,
        });
    }
}

export default new ReviewService();
