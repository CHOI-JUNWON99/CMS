import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client, SharedPassword } from '../types';

interface AccessCode {
  id: string;
  code: string;
  is_active: boolean;
  is_admin: boolean;
  expires_at: string | null;
}

interface SharedPasswordRow {
  id: string;
  name: string;
  password: string;
  is_master: boolean;
  client_ids: string[];
  brand_color: string | null;
  is_active: boolean;
}

const AdminSettings: React.FC = () => {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [sharedPasswords, setSharedPasswords] = useState<SharedPassword[]>([]);

  // 소속 추가 모달
  const [showClientAddModal, setShowClientAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientBrandColor, setNewClientBrandColor] = useState('#1e3a8a');

  // 소속 수정 모달
  const [showClientEditModal, setShowClientEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPassword, setEditClientPassword] = useState('');
  const [editClientBrandColor, setEditClientBrandColor] = useState('#1e3a8a');

  // 프리셋 색상
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

  // 관리자 코드 추가 모달
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');

  // 공유 비밀번호 추가 모달
  const [showSharedAddModal, setShowSharedAddModal] = useState(false);
  const [newSharedName, setNewSharedName] = useState('');
  const [newSharedPassword, setNewSharedPassword] = useState('');
  const [newSharedIsMaster, setNewSharedIsMaster] = useState(false);
  const [newSharedClientIds, setNewSharedClientIds] = useState<string[]>([]);
  const [newSharedBrandColor, setNewSharedBrandColor] = useState('#1e3a8a');

  // 공유 비밀번호 수정 모달
  const [showSharedEditModal, setShowSharedEditModal] = useState(false);
  const [editingShared, setEditingShared] = useState<SharedPassword | null>(null);
  const [editSharedName, setEditSharedName] = useState('');
  const [editSharedPassword, setEditSharedPassword] = useState('');
  const [editSharedIsMaster, setEditSharedIsMaster] = useState(false);
  const [editSharedClientIds, setEditSharedClientIds] = useState<string[]>([]);
  const [editSharedBrandColor, setEditSharedBrandColor] = useState('#1e3a8a');

  // 클라이언트(소속) 로딩
  useEffect(() => {
    fetchClients();
    fetchSharedPasswords();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        setClients(data.map((row: any) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          password: row.password,
          description: row.description,
          logoUrl: row.logo_url,
          brandColor: row.brand_color || '#1e3a8a',
          isActive: row.is_active,
        })));
      }
    } catch (err) {
      console.error('소속 로딩 실패:', err);
    }
  };

  // 공유 비밀번호 로딩
  const fetchSharedPasswords = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_passwords')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        setSharedPasswords(data.map((row: SharedPasswordRow) => ({
          id: row.id,
          name: row.name,
          password: row.password,
          isMaster: row.is_master,
          clientIds: row.client_ids || [],
          brandColor: row.brand_color || '#1e3a8a',
          isActive: row.is_active,
        })));
      }
    } catch (err) {
      console.error('공유 비밀번호 로딩 실패:', err);
    }
  };

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

  // 관리자 코드만 필터링
  const adminCodes = accessCodes.filter(c => c.is_admin);

  // 소속 추가
  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      alert('소속 이름을 입력해주세요.');
      return;
    }
    if (!newClientPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      // 코드는 이름을 기반으로 자동 생성
      const code = newClientName.trim().toLowerCase().replace(/\s+/g, '_');

      const { error } = await supabase
        .from('clients')
        .insert({
          name: newClientName.trim(),
          code: code,
          password: newClientPassword.trim(),
          brand_color: newClientBrandColor,
          is_active: true,
        });

      if (error) throw error;

      setShowClientAddModal(false);
      setNewClientName('');
      setNewClientPassword('');
      setNewClientBrandColor('#1e3a8a');
      fetchClients();
    } catch (err) {
      console.error('소속 추가 실패:', err);
      alert('소속 추가에 실패했습니다.');
    }
  };

  // 소속 수정 모달 열기
  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setEditClientName(client.name);
    setEditClientPassword(client.password || '');
    setEditClientBrandColor(client.brandColor || '#1e3a8a');
    setShowClientEditModal(true);
  };

  // 소속 수정
  const handleEditClient = async () => {
    if (!editingClient) return;
    if (!editClientName.trim()) {
      alert('소속 이름을 입력해주세요.');
      return;
    }
    if (!editClientPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editClientName.trim(),
          password: editClientPassword.trim(),
          brand_color: editClientBrandColor,
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      setShowClientEditModal(false);
      setEditingClient(null);
      setEditClientName('');
      setEditClientPassword('');
      setEditClientBrandColor('#1e3a8a');
      fetchClients();
    } catch (err) {
      console.error('소속 수정 실패:', err);
      alert('소속 수정에 실패했습니다.');
    }
  };

  // 소속 삭제
  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`정말 "${client.name}" 소속을 삭제하시겠습니까?\n\n이 소속에 연결된 포트폴리오와 자료는 삭제되지 않지만, 연결이 해제됩니다.`)) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;
      fetchClients();
    } catch (err) {
      console.error('소속 삭제 실패:', err);
      alert('소속 삭제에 실패했습니다.');
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
  const handleDeleteCode = async (id: string) => {
    if (!confirm('정말 이 관리자 인증코드를 삭제하시겠습니까?')) return;

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

  // 공유 비밀번호 추가
  const handleAddSharedPassword = async () => {
    if (!newSharedName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (!newSharedPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!newSharedIsMaster && newSharedClientIds.length === 0) {
      alert('마스터가 아닌 경우 최소 1개의 소속을 선택해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_passwords')
        .insert({
          name: newSharedName.trim(),
          password: newSharedPassword.trim(),
          is_master: newSharedIsMaster,
          client_ids: newSharedIsMaster ? [] : newSharedClientIds,
          brand_color: newSharedBrandColor,
          is_active: true,
        });

      if (error) throw error;

      setShowSharedAddModal(false);
      setNewSharedName('');
      setNewSharedPassword('');
      setNewSharedIsMaster(false);
      setNewSharedClientIds([]);
      setNewSharedBrandColor('#1e3a8a');
      fetchSharedPasswords();
    } catch (err) {
      console.error('공유 비밀번호 추가 실패:', err);
      alert('공유 비밀번호 추가에 실패했습니다.');
    }
  };

  // 공유 비밀번호 수정 모달 열기
  const openEditSharedModal = (shared: SharedPassword) => {
    setEditingShared(shared);
    setEditSharedName(shared.name);
    setEditSharedPassword(shared.password);
    setEditSharedIsMaster(shared.isMaster);
    setEditSharedClientIds(shared.clientIds);
    setEditSharedBrandColor(shared.brandColor || '#1e3a8a');
    setShowSharedEditModal(true);
  };

  // 공유 비밀번호 수정
  const handleEditSharedPassword = async () => {
    if (!editingShared) return;
    if (!editSharedName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (!editSharedPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!editSharedIsMaster && editSharedClientIds.length === 0) {
      alert('마스터가 아닌 경우 최소 1개의 소속을 선택해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_passwords')
        .update({
          name: editSharedName.trim(),
          password: editSharedPassword.trim(),
          is_master: editSharedIsMaster,
          client_ids: editSharedIsMaster ? [] : editSharedClientIds,
          brand_color: editSharedBrandColor,
        })
        .eq('id', editingShared.id);

      if (error) throw error;

      setShowSharedEditModal(false);
      setEditingShared(null);
      setEditSharedName('');
      setEditSharedPassword('');
      setEditSharedIsMaster(false);
      setEditSharedClientIds([]);
      setEditSharedBrandColor('#1e3a8a');
      fetchSharedPasswords();
    } catch (err) {
      console.error('공유 비밀번호 수정 실패:', err);
      alert('공유 비밀번호 수정에 실패했습니다.');
    }
  };

  // 공유 비밀번호 삭제
  const handleDeleteSharedPassword = async (shared: SharedPassword) => {
    if (!confirm(`정말 "${shared.name}" 공유 비밀번호를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('shared_passwords')
        .delete()
        .eq('id', shared.id);

      if (error) throw error;
      fetchSharedPasswords();
    } catch (err) {
      console.error('공유 비밀번호 삭제 실패:', err);
      alert('공유 비밀번호 삭제에 실패했습니다.');
    }
  };

  // 소속 체크박스 토글
  const toggleClientSelection = (clientId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSharedClientIds(prev =>
        prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
    } else {
      setNewSharedClientIds(prev =>
        prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
      );
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
            code.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
          }`}>
            {code.is_active ? '활성' : '비활성'}
          </span>
        </div>
        {code.expires_at && (
          <span className="text-[10px] text-slate-300 mt-1">만료: {code.expires_at}</span>
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

  // 소속 카드 컴포넌트
  const ClientCard = ({ client, onEdit, onDelete }: { client: Client; onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/70 border border-slate-700 transition-all">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* 브랜드 색상 표시 */}
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
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg bg-blue-900/30 border border-slate-700 text-blue-400 text-xs font-bold hover:bg-blue-900/50 transition-all"
        >
          수정
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

  // 공유 비밀번호 카드 컴포넌트
  const SharedPasswordCard = ({ shared, onEdit, onDelete }: { shared: SharedPassword; onEdit: () => void; onDelete: () => void }) => {
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
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-purple-900/30 border border-slate-700 text-purple-400 text-xs font-bold hover:bg-purple-900/50 transition-all"
          >
            수정
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
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <h2 className="text-lg font-black text-white">설정</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 소속 관리 섹션 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-blue-400 tracking-wider">소속 관리</h3>
                <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-xs font-bold">
                  {clients.length}개
                </span>
              </div>
              <button
                onClick={() => setShowClientAddModal(true)}
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
                clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={() => openEditClientModal(client)}
                    onDelete={() => handleDeleteClient(client)}
                  />
                ))
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

          {/* 공유 비밀번호 섹션 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-purple-400 tracking-wider">공유 비밀번호</h3>
                <span className="px-2 py-0.5 rounded bg-purple-900/30 text-purple-400 text-xs font-bold">
                  {sharedPasswords.length}개
                </span>
              </div>
              <button
                onClick={() => setShowSharedAddModal(true)}
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
                sharedPasswords.map((shared) => (
                  <SharedPasswordCard
                    key={shared.id}
                    shared={shared}
                    onEdit={() => openEditSharedModal(shared)}
                    onDelete={() => handleDeleteSharedPassword(shared)}
                  />
                ))
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
                    onDelete={() => handleDeleteCode(code.id)}
                    onToggle={() => handleToggleActive(code)}
                  />
                ))
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

          {/* 시스템 정보 */}
          <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-sm font-black text-slate-200 tracking-wider mb-4">시스템 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">버전</span>
                <span className="text-white font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">사용자 세션 시간</span>
                <span className="text-white">1시간</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">관리자 세션 시간</span>
                <span className="text-white">2시간</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 소속 추가 모달 */}
      {showClientAddModal && (
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
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newClientBrandColor}
                    onChange={(e) => setNewClientBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setNewClientBrandColor(preset.color)}
                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                          newClientBrandColor === preset.color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">헤더와 포트폴리오 카드에 적용됩니다.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClientAddModal(false);
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 소속 수정 모달 */}
      {showClientEditModal && editingClient && (
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
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editClientBrandColor}
                    onChange={(e) => setEditClientBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setEditClientBrandColor(preset.color)}
                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                          editClientBrandColor === preset.color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClientEditModal(false);
                  setEditingClient(null);
                  setEditClientName('');
                  setEditClientPassword('');
                  setEditClientBrandColor('#1e3a8a');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleEditClient}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
              >
                저장
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
            <p className="text-xs text-slate-300 mb-6">새로운 관리자 인증코드를 추가합니다. 관리자 코드는 신중하게 관리하세요.</p>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">인증코드</label>
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
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
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

      {/* 공유 비밀번호 추가 모달 */}
      {showSharedAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white mb-2">공유 비밀번호 추가</h3>
            <p className="text-xs text-slate-300 mb-6">여러 소속을 한번에 볼 수 있는 비밀번호를 추가합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={newSharedName}
                  onChange={(e) => setNewSharedName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="마스터 또는 SK+신한 공유"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={newSharedPassword}
                  onChange={(e) => setNewSharedPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                  placeholder="master123"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newSharedBrandColor}
                    onChange={(e) => setNewSharedBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setNewSharedBrandColor(preset.color)}
                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                          newSharedBrandColor === preset.color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSharedIsMaster}
                    onChange={(e) => setNewSharedIsMaster(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-white">마스터 (모든 소속 접근)</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-1 ml-8">마스터 비밀번호는 모든 포트폴리오에 접근할 수 있습니다.</p>
              </div>

              {!newSharedIsMaster && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">접근 가능한 소속 선택 *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <label key={client.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newSharedClientIds.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id, false)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-200">{client.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">등록된 소속이 없습니다. 먼저 소속을 추가해주세요.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSharedAddModal(false);
                  setNewSharedName('');
                  setNewSharedPassword('');
                  setNewSharedIsMaster(false);
                  setNewSharedClientIds([]);
                  setNewSharedBrandColor('#1e3a8a');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddSharedPassword}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공유 비밀번호 수정 모달 */}
      {showSharedEditModal && editingShared && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white mb-2">공유 비밀번호 수정</h3>
            <p className="text-xs text-slate-300 mb-6">공유 비밀번호 정보를 수정합니다.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={editSharedName}
                  onChange={(e) => setEditSharedName(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">비밀번호 *</label>
                <input
                  type="text"
                  value={editSharedPassword}
                  onChange={(e) => setEditSharedPassword(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">브랜드 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editSharedBrandColor}
                    onChange={(e) => setEditSharedBrandColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setEditSharedBrandColor(preset.color)}
                        className={`w-7 h-7 rounded-md border-2 transition-all ${
                          editSharedBrandColor === preset.color ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSharedIsMaster}
                    onChange={(e) => setEditSharedIsMaster(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-white">마스터 (모든 소속 접근)</span>
                </label>
              </div>

              {!editSharedIsMaster && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">접근 가능한 소속 선택 *</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <label key={client.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editSharedClientIds.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id, true)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-200">{client.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">등록된 소속이 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSharedEditModal(false);
                  setEditingShared(null);
                  setEditSharedName('');
                  setEditSharedPassword('');
                  setEditSharedIsMaster(false);
                  setEditSharedClientIds([]);
                  setEditSharedBrandColor('#1e3a8a');
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleEditSharedPassword}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
