import { create } from 'zustand';

export interface ClientInfo {
  id: string;
  name: string;
  logo?: string;
  brandColor?: string;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  isLoading: boolean; // 세션 복원 중
  expiresAt: number | null;
  codeVersion: string | null;
  accessType: 'single' | 'shared' | 'master' | null;
  clientInfo: ClientInfo | null;
  clientIds: string[]; // shared 타입용

  // 계산된 값
  isSessionValid: () => boolean;

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
  setLoading: (loading: boolean) => void;
  restoreSession: () => Promise<void>;
}

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15분 (Sliding Session)

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    // 초기 상태
    isAuthenticated: false,
    isLoading: true, // 초기 로딩 상태
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

    // 액션
    login: ({ accessType, clientInfo, clientIds, codeVersion }) => {
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      set({
        isAuthenticated: true,
        isLoading: false,
        expiresAt,
        accessType,
        clientInfo: clientInfo || null,
        clientIds: clientIds || [],
        codeVersion: codeVersion || '1',
      });
    },

    logout: () => {
      // 서버에도 로그아웃 요청
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      set({
        isAuthenticated: false,
        isLoading: false,
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

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    // 페이지 로드 시 서버 세션 복원
    restoreSession: async () => {
      // 개발 환경에서는 서버 세션 없음 (로그인 폼으로 바로 이동)
      if (import.meta.env.DEV) {
        set({ isLoading: false });
        return;
      }

      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) {
          set({ isLoading: false });
          return;
        }

        const data = await res.json();
        if (data.userType === 'user') {
          set({
            isAuthenticated: true,
            isLoading: false,
            expiresAt: Date.now() + SESSION_DURATION_MS,
            accessType: data.accessType,
            clientInfo: data.clientInfo || null,
            clientIds: data.clientIds || [],
            codeVersion: '1',
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    },
  })
);
