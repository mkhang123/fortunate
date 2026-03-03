import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST: Tự động đính kèm accessToken vào mọi request ───────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── RESPONSE: Tự động làm mới accessToken khi hết hạn ───────────────────────
let isRefreshing = false;           // Tránh gọi /refresh nhiều lần cùng lúc
let failedQueue = [];               // Hàng đợi các request bị 401 chờ token mới

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry; // Chỉ retry 1 lần duy nhất

    if (isTokenExpired) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào hàng đợi, chờ token mới
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // Không có refreshToken → buộc logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "http://localhost:4000/api/auth/refresh",
          { refreshToken }
        );

        const newAccessToken = data.accessToken;
        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → logout hoàn toàn
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
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
