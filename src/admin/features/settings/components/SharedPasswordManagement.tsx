import React, { useState } from 'react';
import {
  useSharedPasswords,
  useAddSharedPassword,
  useUpdateSharedPassword,
  useDeleteSharedPassword,
  useClients,
} from '../hooks';
import { toast, confirm } from '@/shared/stores';
import { SharedPassword } from '@/shared/types';

const presetColors = [
  { name: '파랑', color: '#1e3a8a' },
  { name: '빨강', color: '#dc2626' },
  { name: '주황', color: '#ea580c' },
  { name: '초록', color: '#16a34a' },
  { name: '보라', color: '#7c3aed' },
  { name: '분홍', color: '#db2777' },
  { name: '청록', color: '#0891b2' },
  { name: '회색', color: '#475569' },
];

const SharedPasswordManagement: React.FC = () => {
  const { data: sharedPasswords = [], isLoading } = useSharedPasswords();
  const { data: clients = [] } = useClients();
  const addMutation = useAddSharedPassword();
  const updateMutation = useUpdateSharedPassword();
  const deleteMutation = useDeleteSharedPassword();

  // 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsMaster, setNewIsMaster] = useState(false);
  const [newClientIds, setNewClientIds] = useState<string[]>([]);
  const [newBrandColor, setNewBrandColor] = useState('#1e3a8a');

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<SharedPassword | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsMaster, setEditIsMaster] = useState(false);
  const [editClientIds, setEditClientIds] = useState<string[]>([]);
  const [editBrandColor, setEditBrandColor] = useState('#1e3a8a');

  const resetAddForm = () => {
    setNewName('');
    setNewPassword('');
    setNewIsMaster(false);
    setNewClientIds([]);
    setNewBrandColor('#1e3a8a');
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.warning('이름을 입력해주세요.');
      return;
    }
    if (!newPassword.trim()) {
      toast.warning('비밀번호를 입력해주세요.');
      return;
    }
    if (!newIsMaster && newClientIds.length === 0) {
      toast.warning('마스터가 아닌 경우 최소 1개의 소속을 선택해주세요.');
      return;
    }

    try {
      await addMutation.mutateAsync({
        name: newName,
        password: newPassword,
        isMaster: newIsMaster,
        clientIds: newIsMaster ? [] : newClientIds,
        brandColor: newBrandColor,
      });
      setShowAddModal(false);
      resetAddForm();
      toast.success('공유 비밀번호가 추가되었습니다.');
    } catch {
      toast.error('공유 비밀번호 추가에 실패했습니다.');
    }
  };

  const openEditModal = (shared: SharedPassword) => {
    setEditing(shared);
    setEditName(shared.name);
    setEditPassword(shared.password);
    setEditIsMaster(shared.isMaster);
    setEditClientIds(shared.clientIds);
    setEditBrandColor(shared.brandColor || '#1e3a8a');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) {
      toast.warning('이름을 입력해주세요.');
      return;
    }
    if (!editPassword.trim()) {
      toast.warning('비밀번호를 입력해주세요.');
      return;
    }
    if (!editIsMaster && editClientIds.length === 0) {
      toast.warning('마스터가 아닌 경우 최소 1개의 소속을 선택해주세요.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        name: editName,
        password: editPassword,
        isMaster: editIsMaster,
        clientIds: editIsMaster ? [] : editClientIds,
        brandColor: editBrandColor,
      });
      setShowEditModal(false);
      setEditing(null);
      toast.success('공유 비밀번호가 수정되었습니다.');
    } catch {
      toast.error('공유 비밀번호 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (shared: SharedPassword) => {
    const confirmed = await confirm.delete(shared.name);
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(shared.id);
      toast.success('공유 비밀번호가 삭제되었습니다.');
    } catch {
      toast.error('공유 비밀번호 삭제에 실패했습니다.');
    }
  };

  const toggleClientSelection = (clientId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditClientIds(prev =>
        prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
    } else {
      setNewClientIds(prev =>
        prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
    }
  };

  const SharedPasswordCard = ({ shared }: { shared: SharedPassword }) => {
    const clientNames = shared.clientIds
      .map(id => clients.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/70 border border-slate-700 transition-all">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg border-2 border-slate-600 shrink-0"
            style={{ backgroundColor: shared.brandColor || '#1e3a8a' }}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base truncate">{shared.name}</span>
              {shared.isMaster && (
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-black">
                  마스터
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                shared.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}>
                {shared.isActive ? '활성' : '비활성'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-400">비밀번호:</span>
              <span className="font-mono text-sm text-purple-400">{shared.password}</span>
            </div>
            {!shared.isMaster && clientNames && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-400">소속:</span>
                <span className="text-[11px] text-slate-300 truncate">{clientNames}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => openEditModal(shared)}
            className="px-3 py-1.5 rounded-lg bg-purple-900/30 border border-slate-700 text-purple-400 text-xs font-bold hover:bg-purple-900/50 transition-all"
          >
            수정
          </button>
          <button
            onClick={() => handleDelete(shared)}
            disabled={deleteMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-all disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
    );
  };

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
      />
      <div className="flex flex-wrap gap-1.5">
        {presetColors.map((preset) => (
          <button
            key={preset.color}
            type="button"
            onClick={() => onChange(preset.color)}
            className={`w-7 h-7 rounded-md border-2 transition-all ${
              value === preset.color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
            }`}
            style={{ backgroundColor: preset.color }}
            title={preset.name}
          />
        ))}
      </div>
    </div>
  );

  const ClientCheckboxList = ({
    selectedIds,
    onToggle,
    isEdit,
  }: {
    selectedIds: string[];
    onToggle: (id: string) => void;
    isEdit: boolean;
  }) => (
    <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      {clients.length > 0 ? (
        clients.map((client) => (
          <label key={client.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(client.id)}
              onChange={() => onToggle(client.id)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-200">{client.name}</span>
          </label>
        ))
      ) : (
        <p className="text-xs text-slate-400">
          {isEdit ? '등록된 소속이 없습니다.' : '등록된 소속이 없습니다. 먼저 소속을 추가해주세요.'}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-purple-400 tracking-wider">공유 비밀번호</h3>
            <span className="px-2 py-0.5 rounded bg-purple-900/30 text-purple-400 text-xs font-bold">
              {sharedPasswords.length}개
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/30 border border-slate-700 text-purple-400 text-xs font-black hover:bg-purple-900/50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            공유 비밀번호 추가
          </button>
        </div>

        <div className="space-y-2">
          {sharedPasswords.length > 0 ? (
            sharedPasswords.map((shared) => <SharedPasswordCard key={shared.id} shared={shared} />)
          ) : (
            <div className="text-center py-8 text-slate-300 font-bold">
              등록된 공유 비밀번호가 없습니다.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-300">
          공유 비밀번호로 여러 소속의 포트폴리오를 한번에 볼 수 있습니다. 마스터 비밀번호는 모든 소속에 접근할 수 있습니다.
        </p>
      </section>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white mb-2">공유 비밀번호 추가</h3>
            <p className="text-xs text-slate-300 mb-6">여러 소속을 한번에 볼 수 있는 비밀번호를 추가합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="마스터 또는 SK+신한 공유"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                  placeholder="master123"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <ColorPicker value={newBrandColor} onChange={setNewBrandColor} />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsMaster}
                    onChange={(e) => setNewIsMaster(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-white">마스터 (모든 소속 접근)</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 ml-8">마스터 비밀번호는 모든 포트폴리오에 접근할 수 있습니다.</p>
              </div>

              {!newIsMaster && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">접근 가능한 소속 선택 *</label>
                  <ClientCheckboxList
                    selectedIds={newClientIds}
                    onToggle={(id) => toggleClientSelection(id, false)}
                    isEdit={false}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetAddForm();
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
              >
                {addMutation.isPending ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white mb-2">공유 비밀번호 수정</h3>
            <p className="text-xs text-slate-300 mb-6">공유 비밀번호 정보를 수정합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <ColorPicker value={editBrandColor} onChange={setEditBrandColor} />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsMaster}
                    onChange={(e) => setEditIsMaster(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-white">마스터 (모든 소속 접근)</span>
                </label>
              </div>

              {!editIsMaster && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">접근 가능한 소속 선택 *</label>
                  <ClientCheckboxList
                    selectedIds={editClientIds}
                    onToggle={(id) => toggleClientSelection(id, true)}
                    isEdit={true}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleEdit}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SharedPasswordManagement;
