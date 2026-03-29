import axios from "axios";
import { useAuthStore } from "../store/authStore";

const cloud = "https://labpilotclient-backend.onrender.com/api/v1";
const railway = "https://labpilotclient-backend-production.up.railway.app/api/v1";
const local = "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: local,
  timeout: 30000, // increased from 10s → 30s to survive Railway cold starts
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

// Drains the queue and resets isRefreshing — always call this instead of
// manually toggling isRefreshing so the two stay in sync.
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

// ── Response Interceptor: Handle 401s and Token Refresh ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401, 502, or network errors (no response = Railway cold start / timeout)
    const status = error.response?.status;
    const isUnauthorized = status === 401 || status === 502 || !error.response;

    if (isUnauthorized && !originalRequest._retry) {
      // Skip the interceptor for /login — the authStore handles that error itself.
      // Skip /refresh too to prevent infinite loops.
      if (originalRequest.url.includes("/refresh") || originalRequest.url.includes("/login")) {
        if (originalRequest.url.includes("/refresh")) {
          // Clean up refresh state before logging out.
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

        resetRefreshState(null, newAccessToken);

        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        // Drain the queue with the error so queued requests reject cleanly.
        resetRefreshState(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;










// import axios from "axios";

// import { useAuthStore } from "../store/authStore";



// const cloud = "https://labpilotclient-backend.onrender.com/api/v1";

// const railway ="https://labpilotclient-backend-production.up.railway.app/api/v1"

// const local = "http://localhost:3000/api/v1";



// // TO DO

// // after purchasing a domain use the 'cloud' option below and remove /api/*  https://labpilotclient-backend.onrender.com/api/:splat  200 from public/_redirects.

// // baseURL: cloud

// const api = axios.create({

//   baseURL: "/api/v1",

//   timeout: 10000,

//   withCredentials: true, // CRITICAL: Ensures refresh cookies are sent to the backend

// });



// let isRefreshing = false;

// let failedQueue = [];



// const processQueue = (error, token = null) => {

//   failedQueue.forEach((prom) => {

//     if (error) {

//       prom.reject(error);

//     } else {

//       prom.resolve(token);

//     }

//   });

//   failedQueue = [];

// };



// // Drains the queue and resets isRefreshing — always call this instead of

// // manually toggling isRefreshing so the two stay in sync.

// const resetRefreshState = (error = null, token = null) => {

//   processQueue(error, token); // ✅ pass token through so queued requests get the new token

//   isRefreshing = false;

// };



// // ── Request Interceptor: Attach Access Token ──

// api.interceptors.request.use(

//   (config) => {

//     const token = useAuthStore.getState().token;

//     if (token) {

//       config.headers.Authorization = `Bearer ${token}`;

//     }

//     return config;

//   },

//   (error) => Promise.reject(error),

// );



// // ── Response Interceptor: Handle 401s and Token Refresh ──

// api.interceptors.response.use(

//   (response) => response,

//   async (error) => {

//     const originalRequest = error.config;



//     if (error.response?.status === 401 && !originalRequest._retry) {

//       // Skip the interceptor for /login — the authStore handles that error itself.

//       // Skip /refresh too to prevent infinite loops.

//       if (originalRequest.url.includes("/refresh") || originalRequest.url.includes("/login")) {

//         if (originalRequest.url.includes("/refresh")) {

//           // Clean up refresh state before logging out.

//           resetRefreshState(error);

//           useAuthStore.getState().logout();

//         }

//         return Promise.reject(error);

//       }



//       // If another request is already refreshing, queue this one.

//       if (isRefreshing) {

//         return new Promise(function (resolve, reject) {

//           failedQueue.push({ resolve, reject });

//         })

//           .then((token) => {

//             originalRequest.headers["Authorization"] = "Bearer " + token;

//             return api(originalRequest);

//           })

//           .catch((err) => {

//             return Promise.reject(err);

//           });

//       }



//       originalRequest._retry = true;

//       isRefreshing = true;



//       try {

//         const { data } = await api.post("/refresh");

//         const newAccessToken = data.accessToken;



//         useAuthStore.getState().setToken(newAccessToken);



//         // ✅ resetRefreshState now passes the token directly to processQueue,

//         //    so all queued requests get the new token. The old code called

//         //    resetRefreshState(null) then processQueue(null, newAccessToken)

//         //    separately — the second call was redundant (queue was already empty).

//         resetRefreshState(null, newAccessToken);



//         originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;

//         return api(originalRequest);

//       } catch (refreshError) {

//         // Drain the queue with the error so queued requests reject cleanly.

//         resetRefreshState(refreshError);

//         useAuthStore.getState().logout();

//         return Promise.reject(refreshError);

//       }

//       // ✅ Removed the `finally { isRefreshing = false; }` block — resetRefreshState

//       //    already sets isRefreshing = false in both the try and catch paths,

//       //    so the finally was redundant and could race with the next refresh cycle.

//     }



//     return Promise.reject(error);

//   },

// );



// export default api;

