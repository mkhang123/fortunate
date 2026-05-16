import api from './axiosConfig';
export const getDashboardStats = async (params = {}) => {
    return await api.get('/admin/dashboard', { params });
};

export const getAdminVtonSessions = async (params) => {
    return await api.get('/admin/dashboard/vton-sessions', { params });
};
