import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AdminGateProps {
  onAuthenticated: () => void;
}

const ADMIN_SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2시간

const AdminGate: React.FC<AdminGateProps> = ({ onAuthenticated }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_admin_code', {
        input_code: code.trim(),
      });

      if (rpcError) throw rpcError;

      if (data === true) {
        const expiresAt = Date.now() + ADMIN_SESSION_DURATION_MS;
        localStorage.setItem('cms_admin_authenticated', 'true');
        localStorage.setItem('cms_admin_expires_at', String(expiresAt));
        localStorage.setItem('cms_admin_code', code.trim()); // 관리자 코드 저장 (RPC 인증용)
        onAuthenticated();
      } else {
        setError('관리자 인증코드가 올바르지 않습니다.');
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
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="bg-red-600 text-white font-black px-4 py-1.5 rounded-lg text-2xl shadow-lg tracking-tighter">
              CMS
            </div>
            <span className="text-red-500 font-black text-xl">ADMIN</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            관리자 페이지
          </h1>
          <p className="text-slate-500 text-sm font-bold tracking-wide">
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
              autoFocus
              className="w-full px-6 py-4 rounded-2xl bg-slate-800/50 border-2 border-red-900/50 text-white text-center text-lg font-bold tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-red-500 transition-colors"
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
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-lg shadow-xl shadow-red-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                확인 중...
              </span>
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
