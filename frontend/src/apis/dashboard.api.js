import api from './axiosConfig';

// Lấy dữ liệu thống kê dashboard cho admin
export const getDashboardStats = async (params = {}) => {
    return await api.get('/admin/dashboard', { params });
};

export const getAdminVtonSessions = async (params) => {
    return await api.get('/admin/dashboard/vton-sessions', { params });
};
