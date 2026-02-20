import React, { useState } from 'react';
import { useAddIssue, useUpdateIssue, useDeleteIssue } from '@/features/issues';
import { toast, confirm } from '@/shared/stores';

interface Issue {
  id: string;
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  isCMS: boolean;
}

interface Props {
  stockId: string;
  issues: Issue[];
  onRefresh: () => void;
}

const IssueSection: React.FC<Props> = ({ stockId, issues, onRefresh }) => {
  const addMutation = useAddIssue();
  const updateMutation = useUpdateIssue();
  const deleteMutation = useDeleteIssue();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    content: '',
    keywords: '',
    date: '',
    isCMS: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    title: '',
    content: '',
    keywords: '',
    date: '',
    isCMS: false,
  });

  const handleAdd = async () => {
    if (!newIssue.content || !newIssue.date) return;
    try {
      await addMutation.mutateAsync({
        stockId,
        title: newIssue.title || undefined,
        content: newIssue.content,
        keywords: newIssue.keywords.split(',').map(k => k.trim()).filter(k => k),
        date: newIssue.date,
        isCMS: newIssue.isCMS,
      });
      setNewIssue({ title: '', content: '', keywords: '', date: '', isCMS: false });
      setShowAddForm(false);
      toast.success('이슈가 추가되었습니다.');
      onRefresh();
    } catch {
      toast.error('추가 실패');
    }
  };

  const handleEdit = (issue: Issue) => {
    setEditingId(issue.id);
    setEditingData({
      title: issue.title || '',
      content: issue.content || '',
      keywords: Array.isArray(issue.keywords) ? issue.keywords.join(', ') : '',
      date: issue.date || '',
      isCMS: !!issue.isCMS,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !editingData.content || !editingData.date) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        stockId,
        title: editingData.title || undefined,
        content: editingData.content,
        keywords: editingData.keywords.split(',').map(k => k.trim()).filter(k => k),
        date: editingData.date,
        isCMS: editingData.isCMS,
      });
      setEditingId(null);
      toast.success('이슈가 수정되었습니다.');
      onRefresh();
    } catch {
      toast.error('수정 실패');
    }
  };

  const handleDelete = async (issueId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id: issueId, stockId });
      toast.success('이슈가 삭제되었습니다.');
      onRefresh();
    } catch {
      toast.error('삭제 실패');
    }
  };

  return (
    <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-red-400 tracking-wider">
          뉴스 / 이슈 ({issues.length})
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
        >
          + 뉴스 추가
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="text"
            placeholder="제목 (선택)"
            value={newIssue.title}
            onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm mb-2"
          />
          <textarea
            placeholder="내용 *"
            value={newIssue.content}
            onChange={(e) => setNewIssue({ ...newIssue, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none mb-2"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="키워드 (쉼표 구분)"
              value={newIssue.keywords}
              onChange={(e) => setNewIssue({ ...newIssue, keywords: e.target.value })}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
            />
            <input
              type="text"
              placeholder="날짜 (YY/MM/DD) *"
              value={newIssue.date}
              onChange={(e) => setNewIssue({ ...newIssue, date: e.target.value })}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={newIssue.isCMS}
              onChange={(e) => setNewIssue({ ...newIssue, isCMS: e.target.checked })}
              className="rounded"
            />
            <span className="text-xs text-slate-200">CMS증권 코멘트</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold disabled:opacity-50"
            >
              저장
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`p-5 rounded-xl border ${
              issue.isCMS
                ? 'bg-red-900/20 border-red-800/50'
                : 'bg-slate-800/50 border-slate-700'
            }`}
          >
            {editingId === issue.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editingData.title}
                  onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                  placeholder="제목 (선택)"
                />
                <textarea
                  value={editingData.content}
                  onChange={(e) => setEditingData({ ...editingData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none"
                  placeholder="내용 *"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingData.keywords}
                    onChange={(e) => setEditingData({ ...editingData, keywords: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="키워드 (쉼표 구분)"
                  />
                  <input
                    type="text"
                    value={editingData.date}
                    onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="날짜 (YY/MM/DD)"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData.isCMS}
                    onChange={(e) => setEditingData({ ...editingData, isCMS: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-200">CMS증권 코멘트</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                    className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">{issue.date}</span>
                    {issue.isCMS && (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black">
                        CMS
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(issue)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(issue.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {issue.title && (
                  <div className="font-bold text-white text-sm mb-1">{issue.title}</div>
                )}
                <div className="text-xs text-slate-200 line-clamp-3">{issue.content}</div>
                {issue.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {issue.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px]"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default IssueSection;
