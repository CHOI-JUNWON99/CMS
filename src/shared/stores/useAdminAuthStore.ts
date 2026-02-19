import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  isAuthenticated: boolean;
  expiresAt: number | null;
  adminCode: string | null;

  isSessionValid: () => boolean;
  login: (adminCode: string) => void;
  logout: () => void;
  getAdminCode: () => string;
}

const ADMIN_SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2시간

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      expiresAt: null,
      adminCode: null,

      isSessionValid: () => {
        const { isAuthenticated, expiresAt } = get();
        if (!isAuthenticated || !expiresAt) return false;
        return Date.now() < expiresAt;
      },

      login: (adminCode: string) => {
        set({
          isAuthenticated: true,
          expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
          adminCode,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          expiresAt: null,
          adminCode: null,
        });
      },

      getAdminCode: () => get().adminCode || '',
    }),
    {
      name: 'cms-admin-auth-storage',
    }
  )
);
