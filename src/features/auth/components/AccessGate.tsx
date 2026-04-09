import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30초
const STORAGE_KEY = 'cms-login-attempts';

function getLoginAttempts(): { count: number; lockedUntil: number | null } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function setLoginAttempts(count: number, lockedUntil: number | null) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lockedUntil }));
}

function clearLoginAttempts() {
  sessionStorage.removeItem(STORAGE_KEY);
}

interface AccessGateProps {
  onAuthenticated: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const login = useAuthStore((state) => state.login);

  // 잠금 상태 타이머
  useEffect(() => {
    const { lockedUntil } = getLoginAttempts();
    if (!lockedUntil) return;

    const remaining = lockedUntil - Date.now();
    if (remaining <= 0) {
      setLoginAttempts(0, null);
      return;
    }

    setLockoutRemaining(Math.ceil(remaining / 1000));

    const id = setInterval(() => {
      const now = Date.now();
      if (now >= lockedUntil) {
        setLoginAttempts(0, null);
        setLockoutRemaining(0);
        setError('');
        clearInterval(id);
      } else {
        setLockoutRemaining(Math.ceil((lockedUntil - now) / 1000));
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    // 잠금 상태 확인
    const { lockedUntil } = getLoginAttempts();
    if (lockedUntil && Date.now() < lockedUntil) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (import.meta.env.PROD) {
        // 프로덕션: 서버 엔드포인트를 통한 로그인 (httpOnly 쿠키)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password: code.trim() }),
        });

        if (res.ok) {
          clearLoginAttempts();
          const data = await res.json();
          login({
            accessType: data.accessType,
            clientInfo: data.clientInfo,
            clientIds: data.clientIds || [],
            codeVersion: '1',
            showPolicyNews: data.showPolicyNews ?? false,
          });
          onAuthenticated();
          return;
        }
      } else {
        // 개발: Supabase RPC 직접 호출
        const { data, error: rpcError } = await supabase.rpc('verify_client_password', {
          input_password: code.trim(),
        });

        if (rpcError) throw rpcError;

        if (data) {
          clearLoginAttempts();
          const result = data as { type: string; id: string; name: string; logo_url?: string; brand_color?: string; client_ids?: string[] };

          // DEV: show_policy_news 플래그 조회
          let showPolicyNews = false;
          if (result.type === 'master') {
            showPolicyNews = true;
          } else if (result.type === 'shared') {
            const { data: spRow } = await supabase.from('shared_passwords').select('show_policy_news').eq('id', result.id).single();
            showPolicyNews = spRow?.show_policy_news ?? false;
          } else if (result.type === 'single') {
            const { data: clientRow } = await supabase.from('clients').select('show_policy_news').eq('id', result.id).single();
            showPolicyNews = clientRow?.show_policy_news ?? false;
          }

          login({
            accessType: result.type as 'single' | 'shared' | 'master',
            clientInfo: {
              id: result.id,
              name: result.name,
              logo: result.logo_url || undefined,
              brandColor: result.brand_color || undefined,
            },
            clientIds: result.client_ids || [],
            codeVersion: '1',
            showPolicyNews,
          });
          onAuthenticated();
          return;
        }
      }

      // 실패 처리 - 시도 횟수 증가
      const { count } = getLoginAttempts();
      const newCount = count + 1;

      if (newCount >= MAX_ATTEMPTS) {
        const lockedUntilTime = Date.now() + LOCKOUT_DURATION_MS;
        setLoginAttempts(newCount, lockedUntilTime);
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setError(`로그인 시도가 ${MAX_ATTEMPTS}회 초과되었습니다. ${LOCKOUT_DURATION_MS / 1000}초 후 다시 시도해주세요.`);

        // 타이머 시작
        const id = setInterval(() => {
          const now = Date.now();
          if (now >= lockedUntilTime) {
            setLoginAttempts(0, null);
            setLockoutRemaining(0);
            setError('');
            clearInterval(id);
          } else {
            setLockoutRemaining(Math.ceil((lockedUntilTime - now) / 1000));
          }
        }, 1000);
      } else {
        setLoginAttempts(newCount, null);
        setError(`잘못된 비밀번호입니다. (${newCount}/${MAX_ATTEMPTS})`);
      }
      setCode('');
    } catch {
      setError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-block bg-primary text-white font-black px-4 py-1.5 rounded-lg text-2xl shadow-lg tracking-tighter mb-6">
            CMS
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            CMS Portfolio Service
          </h1>
          <p className="text-slate-500 text-sm font-bold tracking-wide">
            Premium Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              maxLength={100}
              autoFocus
              disabled={isLocked}
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border-2 border-slate-700 text-white text-center text-lg font-bold tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-bold text-center animate-in fade-in">
              {error}
              {isLocked && (
                <span className="block mt-1 text-amber-400">
                  {lockoutRemaining}초 후 재시도 가능
                </span>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim() || isLocked}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </span>
            ) : isLocked ? (
              `${lockoutRemaining}초 대기 중...`
            ) : (
              '접속하기'
            )}
          </button>
        </form>

        <p className="text-center text-slate-700 text-xs font-medium mt-8">
          © 2026 CMS Securities. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AccessGate;
