import axios from "axios";
import { useAuthStore } from "../store/authStore";

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const local = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: cloud,
  timeout: 10000,
  withCredentials: true, // CRITICAL: Ensures refresh cookies are sent to the backend
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

// BUG FIX 5: Reset the refresh state so no future requests hang if logout races a refresh.
const resetRefreshState = (error = null) => {
  processQueue(error);
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

// ── Response Interceptor: Handle 401s and Token Refresh ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // BUG FIX 1: Skip the interceptor for /login — the authStore handles that error itself.
      // Skip /refresh too to prevent infinite loops.
      if (originalRequest.url.includes("/refresh") || originalRequest.url.includes("/login")) {
        if (originalRequest.url.includes("/refresh")) {
          // BUG FIX 5: Clean up refresh state before logging out.
          resetRefreshState(error);
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }

      // If another request is already refreshing, queue this one.
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/refresh");
        const newAccessToken = data.accessToken;

        useAuthStore.getState().setToken(newAccessToken);

        // BUG FIX 5: Use resetRefreshState so the queue is always drained and
        // isRefreshing is always cleared — even if something throws after processQueue.
        resetRefreshState(null);
        // Re-resolve queue with new token
        processQueue(null, newAccessToken);

        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        // BUG FIX 5: Drain the queue with the error so queued requests reject cleanly.
        resetRefreshState(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;