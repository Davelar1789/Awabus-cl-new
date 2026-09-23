import { create } from 'zustand';

const PREFS_KEY = 'awabus_driver_prefs';

const defaultPrefs = {
  theme: 'system', // 'system' | 'light' | 'dark'
  notificationSounds: true,
  vibration: true,
  autoSyncOnMobileData: false,
  offlineCacheLimitTrips: 50,
};

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
};

const initialPrefs = loadPrefs();
applyTheme(initialPrefs.theme);

export const useUiStore = create((set, get) => ({
  ...initialPrefs,
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  setPref: (key, value) => {
    const next = { ...get(), [key]: value };
    const persisted = Object.keys(defaultPrefs).reduce((acc, k) => ({ ...acc, [k]: next[k] }), {});
    localStorage.setItem(PREFS_KEY, JSON.stringify(persisted));
    if (key === 'theme') applyTheme(value);
    set({ [key]: value });
  },
}));
