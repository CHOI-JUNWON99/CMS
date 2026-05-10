import { create } from 'zustand';

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: number | null;
  adminCode: string | null; // 인메모리 전용 (localStorage 저장 안 함)

  isSessionValid: () => boolean;
  login: (adminCode: string) => void;
  logout: () => void;
  extendSession: () => void;
  setLoading: (loading: boolean) => void;
  restoreSession: () => Promise<void>;
  getAdminCode: () => string;
}

const ADMIN_SESSION_DURATION_MS = 30 * 60 * 1000; // 30분 (Sliding Session)
const DEV_ADMIN_CODE_STORAGE_KEY = 'cms-dev-admin-code';

function saveDevAdminCode(adminCode: string | null) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  if (!adminCode) {
    sessionStorage.removeItem(DEV_ADMIN_CODE_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(DEV_ADMIN_CODE_STORAGE_KEY, adminCode);
}

function getSavedDevAdminCode() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  return sessionStorage.getItem(DEV_ADMIN_CODE_STORAGE_KEY);
}

export const useAdminAuthStore = create<AdminAuthState>()(
  (set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    expiresAt: null,
    adminCode: null,

    isSessionValid: () => {
      const { isAuthenticated, expiresAt } = get();
      if (!isAuthenticated || !expiresAt) return false;
      return Date.now() < expiresAt;
    },

    login: (adminCode: string) => {
      saveDevAdminCode(adminCode);
      set({
        isAuthenticated: true,
        isLoading: false,
        expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
        adminCode,
      });
    },

    logout: () => {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      saveDevAdminCode(null);
      set({
        isAuthenticated: false,
        isLoading: false,
        expiresAt: null,
        adminCode: null,
      });
    },

    extendSession: () => {
      set({ expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    restoreSession: async () => {
      if (import.meta.env.DEV) {
        const savedAdminCode = getSavedDevAdminCode();
        if (savedAdminCode) {
          set({
            isAuthenticated: true,
            isLoading: false,
            expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
            adminCode: savedAdminCode,
          });
        } else {
          set({ isLoading: false });
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) {
          set({ isLoading: false });
          return;
        }

        const data = await res.json();
        if (data.userType === 'admin') {
          // httpOnly 쿠키로 세션은 복원되지만, adminCode는 없음
          // 관리자 RPC 호출 시 재로그인 필요
          set({
            isAuthenticated: true,
            isLoading: false,
            expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
            adminCode: null,
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    },

    getAdminCode: () => get().adminCode || '',
  })
);
