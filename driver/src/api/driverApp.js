// Thin wrappers over every /api/driver-app endpoint exposed by the server.
// Nothing in the UI calls these yet — the driver app screens haven't been
// built — but the contract is ready so the mobile client can be wired up
// without touching the backend. See server/src/routes/driverAppRoutes.js.
import apiClient, { setDriverToken, clearDriverToken } from './client.js';

export const login = async (phone, password) => {
  const { data } = await apiClient.post('/driver-app/auth/login', { phone, password });
  setDriverToken(data.token);
  return data;
};

export const logout = () => clearDriverToken();

export const getMe = () => apiClient.get('/driver-app/me').then((r) => r.data.data);

export const getTodaysTrip = () => apiClient.get('/driver-app/trips/today').then((r) => r.data.data);

export const startTrip = (tripId) => apiClient.post(`/driver-app/trips/${tripId}/start`).then((r) => r.data.data);

export const endTrip = (tripId) => apiClient.post(`/driver-app/trips/${tripId}/end`).then((r) => r.data.data);

export const pushLocation = (tripId, { lat, lng, heading }) =>
  apiClient.post(`/driver-app/trips/${tripId}/location`, { lat, lng, heading }).then((r) => r.data.data);

export const markAttendance = (tripId, studentId, { attendance, dropoffStatus }) =>
  apiClient
    .post(`/driver-app/trips/${tripId}/students/${studentId}/attendance`, { attendance, dropoffStatus })
    .then((r) => r.data.data);
