import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AccessGateProps {
  onAuthenticated: () => void;
}

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1시간

const AccessGate: React.FC<AccessGateProps> = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_access_code', {
        input_code: code.trim(),
      });

      if (rpcError) throw rpcError;

      if (data === true) {
        // 코드 버전 저장
        const { data: version } = await supabase.rpc('get_active_code_version');
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        localStorage.setItem('cms_authenticated', 'true');
        localStorage.setItem('cms_expires_at', String(expiresAt));
        localStorage.setItem('cms_code_version', String(version ?? 1));
        onAuthenticated();
      } else {
        setError('잘못된 인증코드입니다.');
        setCode('');
      }
    } catch {
      setError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-block bg-primary text-white font-black px-4 py-1.5 rounded-lg text-2xl shadow-lg tracking-tighter mb-6">
            CMS
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            CMS X 신한증권 Wrap
          </h1>
          <p className="text-slate-500 text-sm font-bold tracking-wide">
            Premium Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="인증코드를 입력하세요"
              autoFocus
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border-2 border-slate-700 text-white text-center text-lg font-bold tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-bold text-center animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </span>
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
