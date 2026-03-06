import api from './axiosConfig';

export const vtonAPI = {
  // Thử đồ ảo
  async tryOn(personImage, garmentImage, variantId = null, garmentImageUrl = null) {
    const formData = new FormData();
    formData.append('personImage', personImage);

    if (garmentImage) {
      // Ảnh custom từ máy người dùng
      formData.append('garmentImage', garmentImage);
    } else if (garmentImageUrl) {
      // URL ảnh từ sản phẩm → backend tự download
      formData.append('garmentImageUrl', garmentImageUrl);
    }

    if (variantId) formData.append('variantId', variantId);

    const response = await api.post('/vton/try-on', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Lấy lịch sử thử đồ
  async getHistory(page = 1, limit = 10) {
    const response = await api.get('/vton/history', {
      params: { page, limit },
    });
    return response.data;
  },

  // Lấy chi tiết session
  async getSession(sessionId) {
    const response = await api.get(`/vton/session/${sessionId}`);
    return response.data;
  },

  // Xóa session
  async deleteSession(sessionId) {
    const response = await api.delete(`/vton/session/${sessionId}`);
    return response.data;
  },
};
