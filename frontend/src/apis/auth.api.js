import api from './axiosConfig';
export const registerUser = async (data) => {
    return await api.post('/auth/register', data);
};
export const loginUser = async (data) => {
    return await api.post('/auth/login', data);
};
export const refreshAccessToken = async () => {
    return await api.post('/auth/refresh');
};
export const logoutUser = async () => {
    return await api.post('/auth/logout');
};