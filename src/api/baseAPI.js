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

// ── Request interceptor: attach access token ──────────────────────────────
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

// ── Response interceptor ──────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ── 445: refresh token dead → hard logout, never retry ────────────────
    if (status === 445) {
      resetRefreshState(error);
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // ── 444: access token expired → attempt silent refresh ────────────────
    if (status === 444 && !originalRequest._retry) {
      // /refresh itself came back 444 — should never happen, treat as fatal
      if (originalRequest.url.includes("/refresh")) {
        resetRefreshState(error);
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Another request is already refreshing — queue and wait
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
        // /refresh returned 445 → the 445 block above fires on that response
        // before this catch runs — but we still drain the queue here to be safe
        resetRefreshState(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // All other errors (400, 403, 500, etc.) pass through untouched
    return Promise.reject(error);
  },
);

export default api;
