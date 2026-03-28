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
          .then(() => {
            return api(originalRequest);
          })
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
        // Refresh thất bại → logout hoàn toàn
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
