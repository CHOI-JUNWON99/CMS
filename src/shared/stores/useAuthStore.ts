import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClientInfo {
  id: string;
  name: string;
  logo?: string;
  brandColor?: string;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  expiresAt: number | null;
  codeVersion: string | null;
  accessType: 'single' | 'shared' | 'master' | null;
  clientInfo: ClientInfo | null;
  clientIds: string[]; // shared 타입용

  // 계산된 값
  isSessionValid: () => boolean;
  getRemainingTime: () => number;
  formatRemainingTime: () => string;

  // 액션
  login: (params: {
    accessType: 'single' | 'shared' | 'master';
    clientInfo?: ClientInfo;
    clientIds?: string[];
    codeVersion?: string;
  }) => void;
  logout: () => void;
  extendSession: () => void;
  setCodeVersion: (version: string) => void;
}

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1시간

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isAuthenticated: false,
      expiresAt: null,
      codeVersion: null,
      accessType: null,
      clientInfo: null,
      clientIds: [],

      // 계산된 값
      isSessionValid: () => {
        const { isAuthenticated, expiresAt } = get();
        if (!isAuthenticated || !expiresAt) return false;
        return Date.now() < expiresAt;
      },

      getRemainingTime: () => {
        const { expiresAt } = get();
        if (!expiresAt) return 0;
        return Math.max(0, expiresAt - Date.now());
      },

      formatRemainingTime: () => {
        const ms = get().getRemainingTime();
        if (ms <= 0) return '00:00';
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      },

      // 액션
      login: ({ accessType, clientInfo, clientIds, codeVersion }) => {
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        set({
          isAuthenticated: true,
          expiresAt,
          accessType,
          clientInfo: clientInfo || null,
          clientIds: clientIds || [],
          codeVersion: codeVersion || '1',
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          expiresAt: null,
          codeVersion: null,
          accessType: null,
          clientInfo: null,
          clientIds: [],
        });
      },

      extendSession: () => {
        set({ expiresAt: Date.now() + SESSION_DURATION_MS });
      },

      setCodeVersion: (version: string) => {
        set({ codeVersion: version });
      },
    }),
    {
      name: 'cms-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
        codeVersion: state.codeVersion,
        accessType: state.accessType,
        clientInfo: state.clientInfo,
        clientIds: state.clientIds,
      }),
    }
  )
);
