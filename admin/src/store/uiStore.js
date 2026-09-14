import { create } from 'zustand';

const THEME_KEY = 'awabus_admin_theme';

const applyTheme = (isDark) => {
  const root = document.documentElement;
  if (isDark) root.classList.add('dark');
  else root.classList.remove('dark');
};

const initialDark = localStorage.getItem(THEME_KEY) === 'dark';
applyTheme(initialDark);

export const useUiStore = create((set, get) => ({
  darkMode: initialDark,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    applyTheme(next);
    set({ darkMode: next });
  },
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
