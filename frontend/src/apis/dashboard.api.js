import api from './axiosConfig';

// Lấy dữ liệu thống kê dashboard cho admin
export const getDashboardStats = async () => {
    return await api.get('/admin/dashboard');
};

export const getAdminVtonSessions = async (params) => {
    return await api.get('/admin/dashboard/vton-sessions', { params });
};
