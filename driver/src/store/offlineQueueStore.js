import { create } from 'zustand';

const QUEUE_KEY = 'awabus_driver_offline_queue';

const load = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (queue) => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

// Holds actions that failed to reach the server while offline (a scan, an
// attendance toggle, a GPS ping) so they can be replayed once connectivity
// returns, matching the "Data will sync when you reconnect" promise in the
// design. Each item: { id, kind: 'scan' | 'location', tripId, studentId?, payload, createdAt }.
export const useOfflineQueueStore = create((set, get) => ({
  queue: load(),

  enqueue: (item) => {
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now(), ...item };
    const next = [...get().queue, entry];
    persist(next);
    set({ queue: next });
    return entry.id;
  },

  remove: (id) => {
    const next = get().queue.filter((q) => q.id !== id);
    persist(next);
    set({ queue: next });
  },

  clear: () => {
    persist([]);
    set({ queue: [] });
  },
}));
