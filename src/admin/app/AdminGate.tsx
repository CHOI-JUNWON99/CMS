import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAdminAuthStore } from '@/shared/stores';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30초
const STORAGE_KEY = 'cms-admin-login-attempts';

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

interface AdminGateProps {
  onAuthenticated: () => void;
}

const AdminGate: React.FC<AdminGateProps> = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const login = useAdminAuthStore((state) => state.login);

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
      let success = false;

      if (import.meta.env.PROD) {
        // 프로덕션: 서버 엔드포인트
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: code.trim() }),
        });
        success = res.ok;
      } else {
        // 개발: Supabase RPC 직접 호출
        const { data, error: rpcError } = await supabase.rpc('verify_admin_code', {
          input_code: code.trim(),
        });
        if (rpcError) throw rpcError;
        success = data === true;
      }

      if (success) {
        clearLoginAttempts();
        login(code.trim());
        onAuthenticated();
      } else {
        // 실패 처리 - 시도 횟수 증가
        const { count } = getLoginAttempts();
        const newCount = count + 1;

        if (newCount >= MAX_ATTEMPTS) {
          const lockedUntilTime = Date.now() + LOCKOUT_DURATION_MS;
          setLoginAttempts(newCount, lockedUntilTime);
          setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          setError(`로그인 시도가 ${MAX_ATTEMPTS}회 초과되었습니다. ${LOCKOUT_DURATION_MS / 1000}초 후 다시 시도해주세요.`);

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
          setError(`관리자 인증코드가 올바르지 않습니다. (${newCount}/${MAX_ATTEMPTS})`);
        }
        setCode('');
      }
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
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="bg-red-600 text-white font-black px-4 py-1.5 rounded-lg text-2xl shadow-lg tracking-tighter">
              CMS
            </div>
            <span className="text-red-500 font-black text-xl">ADMIN</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            관리자 페이지
          </h1>
          <p className="text-slate-300 text-sm font-bold tracking-wide">
            Administrator Access Only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="관리자 인증코드를 입력하세요"
              maxLength={100}
              autoFocus
              disabled={isLocked}
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border-2 border-red-900/50 text-white text-center text-lg font-bold tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
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
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-lg shadow-xl shadow-red-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </span>
            ) : isLocked ? (
              `${lockoutRemaining}초 대기 중...`
            ) : (
              '관리자 로그인'
            )}
          </button>
        </form>

        <p className="text-center text-slate-700 text-xs font-medium mt-8">
          © 2026 CMS Securities. Admin Portal.
        </p>
      </div>
    </div>
  );
};

export default AdminGate;
