import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api', // Địa chỉ Backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm Token nếu có (Dùng cho Admin tạo/sửa/xóa)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;