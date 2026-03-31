import axios from "axios";
import { useAuthStore } from "../store/authStore";

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const railway = "https://labpilotclient-backend-production.up.railway.app/api/v1";
const local = "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

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

const resetRefreshState = (error = null, token = null) => {
  processQueue(error, token);
  isRefreshing = false;
};

// ── Request Interceptor: Attach Access Token ──
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle 444/445 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 445 = refresh token invalid/expired → hard logout, no retry
    if (status === 445) {
      resetRefreshState(error);
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // 444 = access token expired → attempt silent refresh
    if (status === 444 && !originalRequest._retry) {
      if (originalRequest.url.includes("/refresh")) {
        resetRefreshState(error);
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Queue this request if a refresh is already in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/refresh");
        const newAccessToken = data.accessToken;
        useAuthStore.getState().setToken(newAccessToken);
        resetRefreshState(null, newAccessToken);
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        // 445 from /refresh will trigger the block above on the next tick,
        // but we drain the queue and logout here too as a safety net
        resetRefreshState(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
