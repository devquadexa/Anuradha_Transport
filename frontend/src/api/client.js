import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

/**
 * Single Axios instance used across all feature API modules. The frontend
 * never talks to the database directly - this is the only communication
 * channel to the backend REST API.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Do not attempt refresh for the refresh endpoint itself, or if no response
    if (!response || config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !config._retry) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          config._retry = true;
          return apiClient(config);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;
        tokenStorage.setTokens({ accessToken, refreshToken: newRefreshToken });
        resolvePendingQueue(null, accessToken);

        config.headers.Authorization = `Bearer ${accessToken}`;
        config._retry = true;
        return apiClient(config);
      } catch (refreshError) {
        resolvePendingQueue(refreshError);
        tokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
