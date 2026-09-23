import { create } from 'zustand';

const STORAGE_KEY = 'awabus_driver_auth';

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persisted = loadPersisted();

export const useAuthStore = create((set) => ({
  token: persisted?.token || null,
  driver: persisted?.driver || null,
  isAuthenticated: Boolean(persisted?.token),

  setAuth: ({ token, driver }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, driver }));
    set({ token, driver, isAuthenticated: true });
  },

  updateDriver: (driver) => {
    set((state) => {
      const next = { token: state.token, driver };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { driver };
    });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, driver: null, isAuthenticated: false });
  },
}));
