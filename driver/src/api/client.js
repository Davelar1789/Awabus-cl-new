import axios from 'axios';

// Mirrors admin/src/api/client.js. The driver app will store its own JWT
// (returned by POST /api/driver-app/auth/login) once the login screen exists.
const TOKEN_KEY = 'awabus_driver_token';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setDriverToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearDriverToken = () => localStorage.removeItem(TOKEN_KEY);

export default apiClient;
