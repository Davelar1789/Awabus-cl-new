import { create } from 'zustand';

// Shared connectivity state: whether the browser thinks we're online, and
// when we last successfully reached the server (used for "Last sync: Xs ago").
export const useConnectionStore = create((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  markSynced: () => set({ lastSyncAt: Date.now(), isOnline: true }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConnectionStore.getState().setOnline(true));
  window.addEventListener('offline', () => useConnectionStore.getState().setOnline(false));
}
