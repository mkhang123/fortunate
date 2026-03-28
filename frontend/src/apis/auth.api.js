import api from './axiosConfig';

// Hàm đăng ký - gọi đến route /api/auth/register ở Backend
export const registerUser = async (data) => {
    return await api.post('/auth/register', data);
};

// Hàm đăng nhập - gọi đến /api/auth/login
export const loginUser = async (data) => {
    return await api.post('/auth/login', data);
};

// Làm mới accessToken bằng refreshToken
export const refreshAccessToken = async () => {
    return await api.post('/auth/refresh');
};

// Đăng xuất - vô hiệu hóa refreshToken trên server
export const logoutUser = async () => {
    return await api.post('/auth/logout');
};