import axios from "axios";
import { useAuthStore } from "../store/authStore";

// ── ID Normalizer ──
function normalizeIds(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "object" && "$oid" in value) return value.$oid;
  if (Array.isArray(value)) return value.map(normalizeIds);
  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) out[key] = normalizeIds(value[key]);
    return out;
  }
  return value;
}

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const local = "http://localhost:5000/api/v1";

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
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Normalize IDs + Handle 401s and Token Refresh ──
api.interceptors.response.use(
  (response) => {
    response.data = normalizeIds(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/refresh") || originalRequest.url.includes("/login")) {
        if (originalRequest.url.includes("/refresh")) {
          resetRefreshState(error);
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
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
        resetRefreshState(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;