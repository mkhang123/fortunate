import api from './axiosConfig';

export const reviewAPI = {
    // Lấy danh sách đánh giá của sản phẩm
    getReviews: (productId) => api.get(`/products/${productId}/reviews`),

    // Kiểm tra quyền đánh giá (cần đăng nhập)
    checkEligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`),

    // Tạo đánh giá mới
    createReview: (productId, data) => {
        const formData = new FormData();
        formData.append("rating", String(data.rating));
        formData.append("comment", data.comment || "");
        (data.images || []).forEach((file) => {
            formData.append("images", file);
        });
        return api.post(`/products/${productId}/reviews`, formData);
    },
};
