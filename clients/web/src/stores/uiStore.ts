import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  activeThreadId: string | null;
  activeProfileUserId: string | null;
  darkMode: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  openProfile: (userId: string) => void;
  closeProfile: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeThreadId: null,
  activeProfileUserId: null,
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  openThread: (messageId) =>
    set({ activeThreadId: messageId }),

  closeThread: () =>
    set({ activeThreadId: null }),

  openProfile: (userId) =>
    set({ activeProfileUserId: userId }),

  closeProfile: () =>
    set({ activeProfileUserId: null }),

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      document.documentElement.classList.toggle('dark', newDarkMode);
      return { darkMode: newDarkMode };
    }),

  setDarkMode: (dark) =>
    set(() => {
      document.documentElement.classList.toggle('dark', dark);
      return { darkMode: dark };
    }),
}));
