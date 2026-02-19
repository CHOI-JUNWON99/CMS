import React, { useState } from 'react';
import {
  useAdminAccessCodes,
  useAddAccessCode,
  useDeleteAccessCode,
  useToggleAccessCode,
  AccessCode,
} from '../hooks';
import { toast, confirm } from '@/shared/stores';

const AdminCodeManagement: React.FC = () => {
  const { data: adminCodes = [], isLoading } = useAdminAccessCodes();
  const addMutation = useAddAccessCode();
  const deleteMutation = useDeleteAccessCode();
  const toggleMutation = useToggleAccessCode();

  // 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');

  const handleAdd = async () => {
    if (!newCode.trim()) {
      toast.warning('인증코드를 입력해주세요.');
      return;
    }

    try {
      await addMutation.mutateAsync({ code: newCode, isAdmin: true });
      setShowAddModal(false);
      setNewCode('');
      toast.success('관리자 인증코드가 추가되었습니다.');
    } catch {
      toast.error('추가에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm.custom({
      title: '인증코드 삭제',
      message: '정말 이 관리자 인증코드를 삭제하시겠습니까?',
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('관리자 인증코드가 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
      toast.success('상태가 변경되었습니다.');
    } catch {
      toast.error('업데이트에 실패했습니다.');
    }
  };

  const CodeCard = ({ code }: { code: AccessCode }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
        code.isActive
          ? 'bg-slate-800/70 border border-slate-700'
          : 'bg-slate-900/50 border border-slate-800 opacity-50'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white text-lg">{code.code}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
            code.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
          }`}>
            {code.isActive ? '활성' : '비활성'}
          </span>
        </div>
        {code.expiresAt && (
          <span className="text-[10px] text-slate-300 mt-1">만료: {code.expiresAt}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleToggle(code.id)}
          disabled={toggleMutation.isPending}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 disabled:opacity-50 ${
            code.isActive
              ? 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50'
              : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
          }`}
        >
          {code.isActive ? '비활성화' : '활성화'}
        </button>
        <button
          onClick={() => handleDelete(code.id)}
          disabled={deleteMutation.isPending}
          className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-all disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-red-400 tracking-wider">관리자 인증코드</h3>
            <span className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 text-xs font-bold">
              {adminCodes.length}개
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
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
            adminCodes.map((code) => <CodeCard key={code.id} code={code} />)
          ) : (
            <div className="text-center py-8 text-slate-300 font-bold">
              등록된 관리자 인증코드가 없습니다.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-300">
          관리자 인증코드로 /admin 페이지에 접속할 수 있습니다. 세션은 2시간 유지됩니다. 관리자 코드 관리에 주의하세요.
        </p>
      </section>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-2">관리자 인증코드 추가</h3>
            <p className="text-xs text-slate-300 mb-6">새로운 관리자 인증코드를 추가합니다. 관리자 코드는 신중하게 관리하세요.</p>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">인증코드</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                placeholder="CMSADMIN2027"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCode('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {addMutation.isPending ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCodeManagement;
