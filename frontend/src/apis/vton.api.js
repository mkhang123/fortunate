import api from './axiosConfig';

export const vtonAPI = {
  async tryOn(personImage, garmentImage, productId = null, garmentImageUrl = null) {
    const formData = new FormData();
    formData.append('personImage', personImage);

    if (garmentImage) {
      formData.append('garmentImage', garmentImage);
    } else if (garmentImageUrl) {
      formData.append('garmentImageUrl', garmentImageUrl);
    }

    if (productId) formData.append('productId', productId);

    const response = await api.post('/vton/try-on', formData);
    return response.data;
  },
  async getHistory(page = 1, limit = 10) {
    const response = await api.get('/vton/history', {
      params: { page, limit },
    });
    return response.data;
  },
  async getSession(sessionId) {
    const response = await api.get(`/vton/session/${sessionId}`);
    return response.data;
  },
  async deleteSession(sessionId) {
    const response = await api.delete(`/vton/session/${sessionId}`);
    return response.data;
  },
  async getConfig() {
    const response = await api.get('/vton/config');
    return response.data;
  },
  async updateColabUrl(colabUrl) {
    const response = await api.put('/vton/config', { colabUrl });
    return response.data;
  },
};
