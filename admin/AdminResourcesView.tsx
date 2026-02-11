import React, { useState, useEffect, useRef } from 'react';
import { Resource, Client } from '../types';
import { supabase, getAdminSupabase } from '../lib/supabase';

interface AdminResourcesViewProps {
  onRefresh: () => void;
}

const AdminResourcesView: React.FC<AdminResourcesViewProps> = ({ onRefresh: _onRefresh }) => {
  const [resources, setResources] = useState<(Resource & { fileUrl?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    fileType: 'PDF' as 'PDF' | 'EXCEL' | 'WORD' | 'PPT',
    category: '',
    file: null as File | null,
    clientId: '' as string,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 클라이언트 로딩
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        if (data) {
          setClients(data.map((row: any) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description,
            logoUrl: row.logo_url,
            isActive: row.is_active,
          })));
        }
      } catch (err) {
        console.error('클라이언트 로딩 실패:', err);
      }
    };

    fetchClients();
  }, []);

  // 데이터 로딩
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.from('resources').select('*').order('date', { ascending: false });
        if (data) {
          setResources(data.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            fileType: r.file_type,
            category: r.category,
            date: r.date,
            fileSize: r.file_size,
            fileUrl: r.file_url,
            clientId: r.client_id,
          })));
        }
      } catch (err) {
        console.error('자료실 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewResource({ ...newResource, file });

      // 파일 타입 자동 감지
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setNewResource(prev => ({ ...prev, file, fileType: 'PDF' }));
      else if (ext === 'xlsx' || ext === 'xls') setNewResource(prev => ({ ...prev, file, fileType: 'EXCEL' }));
      else if (ext === 'docx' || ext === 'doc') setNewResource(prev => ({ ...prev, file, fileType: 'WORD' }));
      else if (ext === 'pptx' || ext === 'ppt') setNewResource(prev => ({ ...prev, file, fileType: 'PPT' }));
    }
  };

  // 자료 추가
  const handleAddResource = async () => {
    if (!newResource.title || !newResource.file) {
      alert('제목과 파일은 필수입니다.');
      return;
    }

    setIsUploading(true);

    try {
      const file = newResource.file;
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Storage 업로드 (관리자 클라이언트 사용)
      const { error: uploadError } = await getAdminSupabase().storage
        .from('resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Public URL 가져오기
      const { data: urlData } = getAdminSupabase().storage.from('resources').getPublicUrl(fileName);

      // 파일 사이즈 계산
      const fileSize = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // 오늘 날짜
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

      // DB 저장 (직접 insert 사용 - client_id 포함)
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          id: `res-${Date.now()}`,
          title: newResource.title,
          description: newResource.description || '',
          file_type: newResource.fileType,
          category: newResource.category || '기타',
          date: dateStr,
          file_size: fileSize,
          file_url: urlData.publicUrl,
          client_id: newResource.clientId || null,
        });

      if (dbError) throw dbError;

      // 리셋
      setShowAddModal(false);
      setNewResource({ title: '', description: '', fileType: 'PDF', category: '', file: null, clientId: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';

      // 새로고침
      const { data } = await supabase.from('resources').select('*').order('date', { ascending: false });
      if (data) {
        setResources(data.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          fileType: r.file_type,
          category: r.category,
          date: r.date,
          fileSize: r.file_size,
          fileUrl: r.file_url,
        })));
      }
    } catch (err) {
      console.error('업로드 실패:', err);
      alert('업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 자료 삭제
  const handleDeleteResource = async (resource: Resource & { fileUrl?: string }) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      // Storage에서 파일 삭제 시도 (파일명 추출)
      if (resource.fileUrl) {
        const fileName = resource.fileUrl.split('/').pop();
        if (fileName) {
          await getAdminSupabase().storage.from('resources').remove([fileName]);
        }
      }

      // DB에서 삭제 (RPC 사용 - 관리자 인증 포함)
      const adminCode = localStorage.getItem('cms_admin_code') || '';
      const { error } = await supabase.rpc('delete_resource', {
        admin_code: adminCode,
        p_id: resource.id,
      });
      if (error) throw error;

      setResources(resources.filter(r => r.id !== resource.id));
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const getFileTypeStyle = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'EXCEL': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
      case 'WORD': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'PPT': return 'bg-orange-900/30 text-orange-400 border-orange-800';
      default: return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  const getClientName = (clientId?: string | null) => {
    if (!clientId) return '모두 공개';
    const client = clients.find(c => c.id === clientId);
    return client?.name || '알 수 없음';
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">자료실 관리 ({resources.length}개)</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          자료 추가
        </button>
      </div>

      {/* 리스트 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((res) => (
            <div
              key={res.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-black ${getFileTypeStyle(res.fileType)}`}>
                  {res.fileType}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{res.title}</div>
                  <div className="text-xs text-slate-300 truncate">{res.description}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                    <span>{res.category}</span>
                    <span>{res.date}</span>
                    <span>{res.fileSize}</span>
                    <span className={`px-1.5 py-0.5 rounded ${res.clientId ? 'bg-blue-900/30 text-blue-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                      {getClientName(res.clientId)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {res.fileUrl && (
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    다운로드
                  </a>
                )}
                <button onClick={() => handleDeleteResource(res)} className="text-red-400 hover:text-red-300 text-xs">
                  삭제
                </button>
              </div>
            </div>
          ))}

          {resources.length === 0 && (
            <div className="text-center py-20 text-slate-300 font-bold">
              등록된 자료가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 자료 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
            <h3 className="text-lg font-black text-white mb-6">새 자료 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">공개 범위 *</label>
                <select
                  value={newResource.clientId}
                  onChange={(e) => setNewResource({ ...newResource, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                >
                  <option value="">모두 공개</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name} 전용</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">'모두 공개'를 선택하면 모든 클라이언트가 이 자료를 볼 수 있습니다.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="자료 제목"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">설명</label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="자료 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">카테고리</label>
                  <input
                    type="text"
                    value={newResource.category}
                    onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="전략 보고서"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">파일 형식</label>
                  <select
                    value={newResource.fileType}
                    onChange={(e) => setNewResource({ ...newResource, fileType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">EXCEL</option>
                    <option value="WORD">WORD</option>
                    <option value="PPT">PPT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">파일 업로드 *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-bold"
                />
                {newResource.file && (
                  <p className="text-xs text-slate-300 mt-1">선택됨: {newResource.file.name}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewResource({ title: '', description: '', fileType: 'PDF', category: '', file: null, clientId: '' });
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddResource}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResourcesView;
