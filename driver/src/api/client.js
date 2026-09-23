import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const message =
      error?.response?.data?.message ||
      (error?.code === 'ERR_NETWORK' || !error?.response
        ? 'No internet connection. Check your data or Wi-Fi and try again.'
        : error?.message) ||
      'Something went wrong. Please try again.';
    const wrapped = new Error(message);
    wrapped.isNetworkError = !error?.response;
    return Promise.reject(wrapped);
  }
);

export default apiClient;
