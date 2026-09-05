import { create } from 'zustand';

const STORAGE_KEY = 'awabus_admin_auth';

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
  admin: persisted?.admin || null,
  isAuthenticated: Boolean(persisted?.token),

  setAuth: ({ token, admin }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, admin }));
    set({ token, admin, isAuthenticated: true });
  },

  updateAdmin: (admin) => {
    set((state) => {
      const next = { token: state.token, admin };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { admin };
    });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));
