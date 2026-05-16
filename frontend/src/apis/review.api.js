import api from './axiosConfig';

export const reviewAPI = {
    getReviews: (productId) => api.get(`/products/${productId}/reviews`),
    checkEligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`),
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
