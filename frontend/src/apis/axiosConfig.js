import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});
let isRefreshing = false;           // Tránh gọi /refresh nhiều lần cùng lúc
let failedQueue = [];               // Hàng đợi các request bị 401 chờ refresh cookie

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(true);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;
    const isTokenExpiredCode = error.response?.data?.code === "TOKEN_EXPIRED";
    const isMissingToken = !error.response?.data?.code; // 401 không có code = cookie bị mất
    const isLoggedIn = !!localStorage.getItem("user");
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    const shouldRefresh =
      is401 &&
      (isTokenExpiredCode || isMissingToken) &&
      isLoggedIn &&
      !originalRequest._retry &&
      !isRefreshRequest;

    if (shouldRefresh) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await axios.post(
          "http://localhost:4000/api/auth/refresh",
          null,
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
