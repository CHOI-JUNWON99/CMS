import React, { useState } from 'react';
import { useClients, useAddClient, useUpdateClient, useDeleteClient } from '../hooks';
import { toast, confirm } from '@/shared/stores';
import { Client } from '@/shared/types';

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

const ClientManagement: React.FC = () => {
  const { data: clients = [], isLoading } = useClients();
  const addClientMutation = useAddClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  // 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientBrandColor, setNewClientBrandColor] = useState('#1e3a8a');

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPassword, setEditClientPassword] = useState('');
  const [editClientBrandColor, setEditClientBrandColor] = useState('#1e3a8a');

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      toast.warning('소속 이름을 입력해주세요.');
      return;
    }
    if (!newClientPassword.trim()) {
      toast.warning('비밀번호를 입력해주세요.');
      return;
    }

    try {
      await addClientMutation.mutateAsync({
        name: newClientName,
        password: newClientPassword,
        brandColor: newClientBrandColor,
      });
      setShowAddModal(false);
      setNewClientName('');
      setNewClientPassword('');
      setNewClientBrandColor('#1e3a8a');
      toast.success('소속이 추가되었습니다.');
    } catch {
      toast.error('소속 추가에 실패했습니다.');
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEditClientName(client.name);
    setEditClientPassword(client.password || '');
    setEditClientBrandColor(client.brandColor || '#1e3a8a');
    setShowEditModal(true);
  };

  const handleEditClient = async () => {
    if (!editingClient) return;
    if (!editClientName.trim()) {
      toast.warning('소속 이름을 입력해주세요.');
      return;
    }
    if (!editClientPassword.trim()) {
      toast.warning('비밀번호를 입력해주세요.');
      return;
    }

    try {
      await updateClientMutation.mutateAsync({
        id: editingClient.id,
        name: editClientName,
        password: editClientPassword,
        brandColor: editClientBrandColor,
      });
      setShowEditModal(false);
      setEditingClient(null);
      toast.success('소속이 수정되었습니다.');
    } catch {
      toast.error('소속 수정에 실패했습니다.');
    }
  };

  const handleDeleteClient = async (client: Client) => {
    const confirmed = await confirm.custom({
      title: '소속 삭제',
      message: `정말 "${client.name}" 소속을 삭제하시겠습니까?\n\n이 소속에 연결된 포트폴리오와 자료는 삭제되지 않지만, 연결이 해제됩니다.`,
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteClientMutation.mutateAsync(client.id);
      toast.success('소속이 삭제되었습니다.');
    } catch {
      toast.error('소속 삭제에 실패했습니다.');
    }
  };

  const ClientCard = ({ client }: { client: Client }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/70 border border-slate-700 transition-all">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-lg border-2 border-slate-600 shrink-0"
          style={{ backgroundColor: client.brandColor || '#1e3a8a' }}
          title={`브랜드 색상: ${client.brandColor || '#1e3a8a'}`}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-base truncate">{client.name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              client.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
            }`}>
              {client.isActive ? '활성' : '비활성'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-slate-400">비밀번호:</span>
            <span className="font-mono text-sm text-blue-400">{client.password || '(없음)'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => openEditModal(client)}
          className="px-3 py-1.5 rounded-lg bg-blue-900/30 border border-slate-700 text-blue-400 text-xs font-bold hover:bg-blue-900/50 transition-all"
        >
          수정
        </button>
        <button
          onClick={() => handleDeleteClient(client)}
          disabled={deleteClientMutation.isPending}
          className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-all disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  );

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

  if (isLoading) {
    return (
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-blue-400 tracking-wider">소속 관리</h3>
            <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-xs font-bold">
              {clients.length}개
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/30 border border-slate-700 text-blue-400 text-xs font-black hover:bg-blue-900/50 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            소속 추가
          </button>
        </div>

        <div className="space-y-2">
          {clients.length > 0 ? (
            clients.map((client) => <ClientCard key={client.id} client={client} />)
          ) : (
            <div className="text-center py-8 text-slate-300 font-bold">
              등록된 소속이 없습니다.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-300">
          소속을 추가하면 해당 소속만의 비밀번호를 설정할 수 있습니다. 사용자는 비밀번호를 입력하여 해당 소속의 포트폴리오와 자료만 볼 수 있습니다.
        </p>
      </section>

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-2">소속 추가</h3>
            <p className="text-xs text-slate-300 mb-6">새로운 소속과 비밀번호를 추가합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">소속 이름 *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="신한투자증권"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={newClientPassword}
                  onChange={(e) => setNewClientPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                  placeholder="shinhan2025"
                />
                <p className="text-[10px] text-slate-400 mt-1">이 비밀번호로 로그인하면 해당 소속의 포트폴리오만 볼 수 있습니다.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <ColorPicker value={newClientBrandColor} onChange={setNewClientBrandColor} />
                <p className="text-[10px] text-slate-400 mt-1">헤더와 포트폴리오 카드에 적용됩니다.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewClientName('');
                  setNewClientPassword('');
                  setNewClientBrandColor('#1e3a8a');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddClient}
                disabled={addClientMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {addClientMutation.isPending ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-2">소속 수정</h3>
            <p className="text-xs text-slate-300 mb-6">소속 정보를 수정합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">소속 이름 *</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={editClientPassword}
                  onChange={(e) => setEditClientPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <ColorPicker value={editClientBrandColor} onChange={setEditClientBrandColor} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingClient(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleEditClient}
                disabled={updateClientMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {updateClientMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientManagement;
