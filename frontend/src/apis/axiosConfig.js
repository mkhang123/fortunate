import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST: FormData thì để browser tự set boundary ────────────────────────
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// ─── RESPONSE: Tự động làm mới accessToken khi hết hạn ───────────────────────
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

    // Trigger refresh khi:
    // 1. Token còn trong cookie nhưng hết hạn (code: TOKEN_EXPIRED)
    // 2. Cookie đã bị browser xóa sau 15p → request đến không kèm token (401 không có code)
    // Điều kiện chung: phải có user trong localStorage (đang đăng nhập),
    // chưa retry, và không phải request refresh (tránh vòng lặp vô hạn)
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
        // Nếu đang refresh, đưa request vào hàng đợi, chờ token mới
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
        // Refresh token cũng hết hạn (7 ngày) → logout hoàn toàn
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
