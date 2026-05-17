import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, token: data.token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      setUser: (user) => set({ user }),

      switchRole: async (role) => {
        const emails = {
          employee: 'employee@demo.com',
          manager:  'manager@demo.com',
          admin:    'admin@demo.com',
        };
        return get().login(emails[role], 'password123');
      },
    }),
    {
      name: 'goalflow-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);

// ── Goals Store ───────────────────────────────────────────────────────────────
export const useGoalsStore = create((set, get) => ({
  goals:       [],
  loading:     false,
  error:       null,
  activeCycle: null,

  fetchGoals: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/goals', { params });
      set({ goals: data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch goals', loading: false });
    }
  },

  fetchActiveCycle: async () => {
    // Return cached if already loaded
    const cached = get().activeCycle;
    if (cached) return cached;
    try {
      const { data } = await api.get('/cycles/active');
      set({ activeCycle: data.data });
      return data.data;
    } catch {
      return null;
    }
  },

  createGoal: async (goalData) => {
    const { data } = await api.post('/goals', goalData);
    set(s => ({ goals: [data.data, ...s.goals] }));
    return data.data;
  },

  updateGoal: async (id, updates) => {
    const { data } = await api.put(`/goals/${id}`, updates);
    set(s => ({ goals: s.goals.map(g => g._id === id ? data.data : g) }));
    return data.data;
  },

  deleteGoal: async (id) => {
    await api.delete(`/goals/${id}`);
    set(s => ({ goals: s.goals.filter(g => g._id !== id) }));
  },

  submitGoals: async (cycleId) => {
    // cycleId is the ObjectId string from activeCycle._id
    const cycleIdStr = String(cycleId);
    await api.post('/goals/submit', { cycleId: cycleIdStr });
    // Refresh goals from server to get accurate state
    const params = { cycleId: cycleIdStr };
    const { data } = await api.get('/goals', { params });
    set({ goals: data.data });
  },

  approveGoal: async (id, payload) => {
    const { data } = await api.post(`/goals/${id}/approve`, payload);
    set(s => ({ goals: s.goals.map(g => g._id === id ? data.data : g) }));
    return data.data;
  },

  rejectGoal: async (id, payload) => {
    const { data } = await api.post(`/goals/${id}/reject`, payload);
    set(s => ({ goals: s.goals.map(g => g._id === id ? data.data : g) }));
    return data.data;
  },

  updateCheckIn: async (goalId, checkInData) => {
    const { data } = await api.put(`/goals/${goalId}/checkin`, checkInData);
    set(s => ({ goals: s.goals.map(g => g._id === goalId ? data.data : g) }));
    return data.data;
  },

  unlockGoal: async (id) => {
    const { data } = await api.post(`/goals/${id}/unlock`);
    set(s => ({ goals: s.goals.map(g => g._id === id ? data.data : g) }));
    return data.data;
  },

  clearCycle: () => set({ activeCycle: null }),
}));

// ── Notifications Store ───────────────────────────────────────────────────────
export const useNotificationsStore = create((set) => ({
  notifications: [],
  unread: 0,

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.data || [], unread: data.unread || 0 });
    } catch { /* silent */ }
  },

  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set(s => ({
        notifications: s.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unread: Math.max(0, s.unread - 1),
      }));
    } catch { /* silent */ }
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, isRead: true })),
        unread: 0,
      }));
    } catch { /* silent */ }
  },
}));

// ── UI Store ──────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  darkMode:    false,

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  toggleDarkMode: () => {
    set(s => {
      const next = !s.darkMode;
      document.documentElement.classList.toggle('dark', next);
      return { darkMode: next };
    });
  },
}));
