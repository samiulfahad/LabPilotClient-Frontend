import axios from "axios";
import { useAuthStore } from "../store/authStore";

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const local = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: local, // Change to cloud for production
  timeout: 10000,
  withCredentials: true, // CRITICAL: Ensures refresh cookies are sent to the backend
});

// Variables to handle multiple simultaneous requests when token expires
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

// ── Request Interceptor: Attach Access Token ──
api.interceptors.request.use(
  (config) => {
    // Get token directly from Zustand state
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

    // If error is 401 and we haven't already retried this specific request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the refresh endpoint itself fails with 401, logout immediately
      // This prevents infinite loops
      if (originalRequest.url.includes("/refresh")) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // If another request is already refreshing the token, queue this one up
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest); // Retry request with new token
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Start the refresh process
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Because withCredentials is true, the httpOnly refresh cookie is sent automatically
        const { data } = await api.post("/refresh");
        const newAccessToken = data.accessToken;

        // Update Zustand store with the new token
        useAuthStore.getState().setToken(newAccessToken);

        // Process any other requests that were waiting
        processQueue(null, newAccessToken);

        // Retry the original failed request
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        // The refresh token is expired or invalid
        processQueue(refreshError, null);
        useAuthStore.getState().logout(); // Nuke the state and redirect
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
