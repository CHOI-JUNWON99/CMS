import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AccessCode {
  id: string;
  code: string;
  is_active: boolean;
  is_admin: boolean;
  expires_at: string | null;
}

const AdminSettings: React.FC = () => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 코드 추가 모달
  const [showUserAddModal, setShowUserAddModal] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');

  // 관리자 코드 추가 모달
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');

  // 인증코드 로딩 (RPC 사용)
  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_access_codes');
      if (error) {
        console.error('인증코드 로딩 에러:', error);
        return;
      }
      if (data) {
        setAccessCodes(data);
      }
    } catch (err) {
      console.error('인증코드 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자/관리자 코드 분리
  const userCodes = accessCodes.filter(c => !c.is_admin);
  const adminCodes = accessCodes.filter(c => c.is_admin);

  // 사용자 코드 추가 (RPC 사용)
  const handleAddUserCode = async () => {
    if (!newUserCode.trim()) {
      alert('인증코드를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase.rpc('add_access_code', {
        input_code: newUserCode.trim(),
        input_is_admin: false,
      });

      if (error) throw error;

      setShowUserAddModal(false);
      setNewUserCode('');
      fetchCodes();
    } catch (err) {
      console.error('추가 실패:', err);
      alert('추가에 실패했습니다.');
    }
  };

  // 관리자 코드 추가 (RPC 사용)
  const handleAddAdminCode = async () => {
    if (!newAdminCode.trim()) {
      alert('인증코드를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase.rpc('add_access_code', {
        input_code: newAdminCode.trim(),
        input_is_admin: true,
      });

      if (error) throw error;

      setShowAdminAddModal(false);
      setNewAdminCode('');
      fetchCodes();
    } catch (err) {
      console.error('추가 실패:', err);
      alert('추가에 실패했습니다.');
    }
  };

  // 코드 삭제 (RPC 사용)
  const handleDeleteCode = async (id: string, isAdmin: boolean) => {
    const type = isAdmin ? '관리자' : '사용자';
    if (!confirm(`정말 이 ${type} 인증코드를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.rpc('delete_access_code', {
        input_id: id,
      });
      if (error) throw error;
      fetchCodes();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  // 활성화/비활성화 토글 (RPC 사용)
  const handleToggleActive = async (code: AccessCode) => {
    try {
      const { error } = await supabase.rpc('toggle_access_code', {
        input_id: code.id,
      });

      if (error) throw error;
      fetchCodes();
    } catch (err) {
      console.error('업데이트 실패:', err);
      alert('업데이트에 실패했습니다.');
    }
  };

  // 코드 카드 컴포넌트
  const CodeCard = ({ code, onDelete, onToggle }: { code: AccessCode; onDelete: () => void; onToggle: () => void }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
        code.is_active
          ? 'bg-slate-800/70 border border-slate-700'
          : 'bg-slate-900/50 border border-slate-800 opacity-50'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white text-lg">{code.code}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
            code.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            {code.is_active ? '활성' : '비활성'}
          </span>
        </div>
        {code.expires_at && (
          <span className="text-[10px] text-slate-500 mt-1">만료: {code.expires_at}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 ${
            code.is_active
              ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50'
              : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
          }`}
        >
          {code.is_active ? '비활성화' : '활성화'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-all"
        >
          삭제
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <h2 className="text-lg font-black text-white">설정</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 사용자 인증코드 섹션 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-emerald-400 tracking-wider">사용자 인증코드</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 text-xs font-bold">
                  {userCodes.length}개
                </span>
              </div>
              <button
                onClick={() => setShowUserAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-slate-700 text-emerald-400 text-xs font-black hover:bg-emerald-900/50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                사용자 코드 추가
              </button>
            </div>

            <div className="space-y-2">
              {userCodes.length > 0 ? (
                userCodes.map((code) => (
                  <CodeCard
                    key={code.id}
                    code={code}
                    onDelete={() => handleDeleteCode(code.id, false)}
                    onToggle={() => handleToggleActive(code)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 font-bold">
                  등록된 사용자 인증코드가 없습니다.
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              사용자 인증코드로 로그인한 사용자는 1시간 동안 세션이 유지됩니다. 코드를 비활성화하면 해당 코드로 더 이상 로그인할 수 없습니다.
            </p>
          </section>

          {/* 관리자 인증코드 섹션 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-red-400 tracking-wider">관리자 인증코드</h3>
                <span className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 text-xs font-bold">
                  {adminCodes.length}개
                </span>
              </div>
              <button
                onClick={() => setShowAdminAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                관리자 코드 추가
              </button>
            </div>

            <div className="space-y-2">
              {adminCodes.length > 0 ? (
                adminCodes.map((code) => (
                  <CodeCard
                    key={code.id}
                    code={code}
                    onDelete={() => handleDeleteCode(code.id, true)}
                    onToggle={() => handleToggleActive(code)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 font-bold">
                  등록된 관리자 인증코드가 없습니다.
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              관리자 인증코드로 /admin 페이지에 접속할 수 있습니다. 세션은 2시간 유지됩니다. 관리자 코드 관리에 주의하세요.
            </p>
          </section>

          {/* 시스템 정보 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-sm font-black text-slate-400 tracking-wider mb-4">시스템 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">버전</span>
                <span className="text-white font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">사용자 세션 시간</span>
                <span className="text-white">1시간</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">관리자 세션 시간</span>
                <span className="text-white">2시간</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 사용자 코드 추가 모달 */}
      {showUserAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-2">사용자 인증코드 추가</h3>
            <p className="text-xs text-slate-500 mb-6">새로운 사용자 인증코드를 추가합니다.</p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">인증코드</label>
              <input
                type="text"
                value={newUserCode}
                onChange={(e) => setNewUserCode(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                placeholder="CMS2027VIP"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUserAddModal(false);
                  setNewUserCode('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddUserCode}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 코드 추가 모달 */}
      {showAdminAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-2">관리자 인증코드 추가</h3>
            <p className="text-xs text-slate-500 mb-6">새로운 관리자 인증코드를 추가합니다. 관리자 코드는 신중하게 관리하세요.</p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">인증코드</label>
              <input
                type="text"
                value={newAdminCode}
                onChange={(e) => setNewAdminCode(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                placeholder="CMSADMIN2027"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdminAddModal(false);
                  setNewAdminCode('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddAdminCode}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
