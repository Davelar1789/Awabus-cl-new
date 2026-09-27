import { create } from 'zustand';
import { queryClient } from '../lib/queryClient.js';
import { useViewSchoolStore } from './viewSchoolStore.js';

const DRAFT_PREFIX = 'awabus.draft.';

const STORAGE_KEY = 'awabus_admin_auth';

// Without "Remember this device" the sign-in lapses after this long (it is
// still shared by all tabs). With it, it lasts until the token expires (7 days).
const UNREMEMBERED_HOURS = 12;

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved?.until && Date.now() > saved.until) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

const persisted = loadPersisted();

/** True when a sign-in without "Remember this device" has run out. */
export const signInLapsed = () => {
  try {
    const until = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')?.until;
    return Boolean(until && Date.now() > until);
  } catch {
    return false;
  }
};

// Keeps the expiry of the current sign-in when the token or profile is updated.
const save = (value) => {
  try {
    const until = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')?.until;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(until ? { ...value, until } : value));
  } catch {
    /* storage unavailable: signed in for this page only */
  }
};

export const useAuthStore = create((set) => ({
  token: persisted?.token || null,
  admin: persisted?.admin || null,
  isAuthenticated: Boolean(persisted?.token),

  setAuth: ({ token, admin }, { remember = true } = {}) => {
    // A new sign-in starts clean: nothing loaded for a previous account is kept.
    queryClient.clear();
    useViewSchoolStore.getState().clear();
    const until = remember ? undefined : Date.now() + UNREMEMBERED_HOURS * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, admin, until }));
    set({ token, admin, isAuthenticated: true });
  },

  // A new sign-in token for the same account (e.g. after changing the password,
  // which signs out every other session).
  setToken: (token) => {
    set((state) => {
      save({ token, admin: state.admin });
      return { token };
    });
  },

  updateAdmin: (admin) => {
    set((state) => {
      save({ token: state.token, admin });
      return { admin };
    });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    // Unsaved form drafts can contain student/driver personal data.
    Object.keys(localStorage)
      .filter((k) => k.startsWith(DRAFT_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    // Forget everything this account loaded (students, live trips, ...) so the
    // next person to sign in on this browser never sees it, even briefly.
    queryClient.clear();
    useViewSchoolStore.getState().clear();
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));
