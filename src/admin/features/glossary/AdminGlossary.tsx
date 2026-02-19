import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { DbGlossaryRow } from '@/shared/types';
import { toast, confirm, useAdminAuthStore } from '@/shared/stores';

interface AdminGlossaryProps {
  glossary: Record<string, string>;
  onRefresh: () => void;
}

interface GlossaryItem {
  term: string;
  definition: string;
}

const AdminGlossary: React.FC<AdminGlossaryProps> = ({ onRefresh }) => {
  // Admin 인증 (store 사용)
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);

  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GlossaryItem | null>(null);
  const [newTerm, setNewTerm] = useState({ term: '', definition: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    const fetchGlossary = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('glossary').select('term, definition').order('term');
        if (error) throw error;
        if (data) {
          setItems((data as DbGlossaryRow[]).map((row) => ({
            term: row.term,
            definition: row.definition,
          })));
        }
      } catch (err) {
        console.error('용어사전 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGlossary();
  }, []);

  // 검색 필터링
  const filteredItems = items.filter(item =>
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 용어 추가 (RPC 사용)
  const handleAddTerm = async () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) {
      toast.warning('용어와 정의를 모두 입력해주세요.');
      return;
    }

    // 중복 체크
    if (items.some(item => item.term === newTerm.term.trim())) {
      toast.warning('이미 등록된 용어입니다.');
      return;
    }

    setIsSubmitting(true);
    const adminCode = getAdminCode();

    try {
      const { error } = await supabase.rpc('add_glossary_term', {
        admin_code: adminCode,
        p_term: newTerm.term.trim(),
        p_definition: newTerm.definition.trim(),
      });

      if (error) throw error;

      setItems([...items, { term: newTerm.term.trim(), definition: newTerm.definition.trim() }].sort((a, b) => a.term.localeCompare(b.term)));
      setShowAddModal(false);
      setNewTerm({ term: '', definition: '' });
      onRefresh();
      toast.success('용어가 추가되었습니다.');
    } catch (err) {
      console.error('추가 실패:', err);
      toast.error('추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 모드 시작
  const startEditing = (item: GlossaryItem) => {
    setEditingTerm(item.term);
    setEditingItem({ ...item });
  };

  // 수정 취소
  const cancelEditing = () => {
    setEditingTerm(null);
    setEditingItem(null);
  };

  // 용어 수정 (RPC 사용)
  const handleUpdateTerm = async () => {
    if (!editingItem || !editingTerm) return;

    if (!editingItem.definition.trim()) {
      toast.warning('정의를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const adminCode = getAdminCode();

    try {
      const { error } = await supabase.rpc('update_glossary_term', {
        admin_code: adminCode,
        p_term: editingTerm,
        p_definition: editingItem.definition.trim(),
      });

      if (error) throw error;

      setItems(items.map(item =>
        item.term === editingTerm
          ? { ...item, definition: editingItem.definition.trim() }
          : item
      ));
      cancelEditing();
      onRefresh();
      toast.success('용어가 수정되었습니다.');
    } catch (err) {
      console.error('수정 실패:', err);
      toast.error('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 용어 삭제 (RPC 사용)
  const handleDeleteTerm = async (term: string) => {
    const confirmed = await confirm.delete(term);
    if (!confirmed) return;

    const adminCode = getAdminCode();

    try {
      const { error } = await supabase.rpc('delete_glossary_term', {
        admin_code: adminCode,
        p_term: term,
      });

      if (error) throw error;

      setItems(items.filter(item => item.term !== term));
      onRefresh();
      toast.success('용어가 삭제되었습니다.');
    } catch (err) {
      console.error('삭제 실패:', err);
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 주의사항 배너 */}
      <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-400 mb-2">용어 등록 시 주의사항</h4>
            <ul className="space-y-1.5 text-xs text-amber-200/80 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-black">1.</span>
                <span><strong className="text-amber-300">대소문자 구분됨</strong> — AI ≠ ai ≠ Ai (각각 별도 등록 필요)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-black">2.</span>
                <span><strong className="text-amber-300">정확히 일치해야 함</strong> — 'AI'만 등록하면 'AI칩', 'AI기술' 등은 하이라이트 안됨</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-black">3.</span>
                <span><strong className="text-amber-300">필요시 변형도 등록</strong> — 'AI', 'AI칩', 'AI기술'을 각각 별도 용어로 등록 가능</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">용어사전 관리 ({items.length}개)</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          용어 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="용어 또는 정의 검색..."
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-600"
        />
      </div>

      {/* 리스트 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-200">용어사전을 불러오는 중...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.term}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
            >
              {editingTerm === item.term && editingItem ? (
                // 수정 모드
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-red-400 text-sm font-black">
                    {item.term}
                    <span className="text-slate-300 text-xs font-normal ml-2">(용어는 수정 불가)</span>
                  </div>
                  <textarea
                    value={editingItem.definition}
                    onChange={(e) => setEditingItem({ ...editingItem, definition: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-slate-600"
                    placeholder="정의를 입력하세요"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateTerm}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-600 disabled:opacity-50 transition-all"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-red-400 text-sm mb-1">{item.term}</div>
                    <div className="text-sm text-slate-200 break-words">{item.definition}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEditing(item)} className="text-blue-400 hover:text-blue-300 text-xs">수정</button>
                    <button onClick={() => handleDeleteTerm(item.term)} className="text-red-400 hover:text-red-300 text-xs">삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredItems.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <div className="text-slate-300 font-bold mb-2">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 용어가 없습니다.'}
              </div>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-red-400 text-sm font-bold hover:underline"
                >
                  첫 번째 용어 추가하기
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 용어 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
            <h3 className="text-lg font-black text-white mb-6">새 용어 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">용어 *</label>
                <input
                  type="text"
                  value={newTerm.term}
                  onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  placeholder="NDR, MOU, EBITDA 등"
                />
                <p className="text-[10px] text-slate-300 mt-1">대소문자를 정확히 입력하세요 (AI ≠ ai)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">정의 *</label>
                <textarea
                  value={newTerm.definition}
                  onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-slate-600"
                  placeholder="용어에 대한 설명을 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTerm({ term: '', definition: '' });
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddTerm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGlossary;
