import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required: sends cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── 401 Interceptor with Refresh Queue ─────────────────────────────
// Endpoints that should NOT trigger a refresh attempt
const AUTH_EXCLUSIONS = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh'];

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, shouldRetry = false) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (shouldRetry) {
      resolve();
    } else {
      reject(error);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s, skip if already retried or if it's an auth endpoint
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      AUTH_EXCLUSIONS.some((url) => originalRequest.url?.includes(url))
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post('/auth/refresh');

      // Refresh succeeded — retry all queued requests and the original
      processQueue(null, true);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh failed — reject all queued requests
      // No hard redirect here; ProtectedRoute handles navigation
      processQueue(refreshError, false);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
