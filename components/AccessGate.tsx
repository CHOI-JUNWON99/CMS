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
      // 1. 먼저 단일 소속 비밀번호 확인
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, logo_url, brand_color')
        .eq('password', code.trim())
        .eq('is_active', true)
        .single();

      if (clientData) {
        // 단일 소속 로그인 성공
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        localStorage.setItem('cms_authenticated', 'true');
        localStorage.setItem('cms_expires_at', String(expiresAt));
        localStorage.setItem('cms_code_version', '1');
        localStorage.setItem('cms_access_type', 'single');
        localStorage.setItem('cms_client_id', clientData.id);
        localStorage.setItem('cms_client_name', clientData.name);
        if (clientData.logo_url) {
          localStorage.setItem('cms_client_logo', clientData.logo_url);
        }
        if (clientData.brand_color) {
          localStorage.setItem('cms_client_brand_color', clientData.brand_color);
        }
        onAuthenticated();
        return;
      }

      // 2. 공유 비밀번호 확인
      const { data: sharedData } = await supabase
        .from('shared_passwords')
        .select('id, name, is_master, client_ids, brand_color')
        .eq('password', code.trim())
        .eq('is_active', true)
        .single();

      if (sharedData) {
        // 공유 비밀번호 로그인 성공
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        localStorage.setItem('cms_authenticated', 'true');
        localStorage.setItem('cms_expires_at', String(expiresAt));
        localStorage.setItem('cms_code_version', '1');

        if (sharedData.is_master) {
          localStorage.setItem('cms_access_type', 'master');
        } else {
          localStorage.setItem('cms_access_type', 'shared');
          localStorage.setItem('cms_client_ids', JSON.stringify(sharedData.client_ids || []));
        }

        localStorage.setItem('cms_client_name', sharedData.name);
        if (sharedData.brand_color) {
          localStorage.setItem('cms_client_brand_color', sharedData.brand_color);
        }
        onAuthenticated();
        return;
      }

      // 3. 둘 다 없으면 에러
      setError('잘못된 비밀번호입니다.');
      setCode('');
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
            CMS Portfolio Service
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
              placeholder="비밀번호를 입력하세요"
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
