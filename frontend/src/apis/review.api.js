import api from './axiosConfig';

export const reviewAPI = {
    // Lấy danh sách đánh giá của sản phẩm
    getReviews: (productId) => api.get(`/products/${productId}/reviews`),

    // Kiểm tra quyền đánh giá (cần đăng nhập)
    checkEligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`),

    // Tạo đánh giá mới
    createReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};
