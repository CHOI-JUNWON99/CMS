import { useEffect, useRef } from 'react';

interface SlidingSessionOptions {
  isAuthenticated: boolean;
  extendSession: () => void;
  logout: () => void;
  /** 서버 refresh 호출 건너뛰기 (verifyAdminWithRefresh가 서버사이드에서 처리하는 경우) */
  skipServerRefresh?: boolean;
}

const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove'] as const;
const EXTEND_THROTTLE_MS = 60 * 1000;      // 클라이언트 세션 연장 1분 간격 throttle
const REFRESH_THROTTLE_MS = 5 * 60 * 1000; // 서버 refresh 5분 간격 throttle

/**
 * Sliding Session 훅
 * - 사용자 활동(click, keydown, scroll, mousemove) 감지 시 클라이언트 세션 타이머 자동 리셋
 * - 서버 토큰 갱신은 5분 간격으로 throttle하여 과도한 요청 방지
 */
export function useSlidingSession({ isAuthenticated, extendSession, logout, skipServerRefresh }: SlidingSessionOptions) {
  const lastExtendRef = useRef<number>(0);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // 클라이언트 세션 타이머 리셋 (1분 간격 throttle → 불필요한 store 업데이트 방지)
      const now = Date.now();
      if (now - lastExtendRef.current >= EXTEND_THROTTLE_MS) {
        lastExtendRef.current = now;
        extendSession();
      }

      // 서버 refresh는 5분 간격으로 throttle
      // 관리자 세션: verifyAdminWithRefresh가 서버사이드에서 토큰을 자동 갱신하므로
      // 여기서 별도로 /api/auth/refresh를 호출하면 race condition 발생 → skipServerRefresh 사용
      if (skipServerRefresh) return;

      if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return;
      lastRefreshRef.current = now;

      if (import.meta.env.PROD) {
        fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {
          // 네트워크 오류는 무시 (다음 활동 시 재시도)
        });
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [isAuthenticated, extendSession, logout]);
}
