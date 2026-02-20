import React, { useState } from 'react';
import {
  useAddInvestmentPoint,
  useUpdateInvestmentPoint,
  useDeleteInvestmentPoint,
} from '@/features/stocks';
import { toast, confirm } from '@/shared/stores';

interface InvestmentPoint {
  id: string;
  title: string;
  description: string;
}

interface Props {
  stockId: string;
  investmentPoints: InvestmentPoint[];
  onRefresh: () => void;
}

const InvestmentPointSection: React.FC<Props> = ({ stockId, investmentPoints, onRefresh }) => {
  const addMutation = useAddInvestmentPoint();
  const updateMutation = useUpdateInvestmentPoint();
  const deleteMutation = useDeleteInvestmentPoint();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPoint, setNewPoint] = useState({ title: '', description: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ title: '', description: '' });

  const handleAdd = async () => {
    if (!newPoint.title) return;
    try {
      await addMutation.mutateAsync({
        stockId,
        title: newPoint.title,
        description: newPoint.description,
        sortOrder: investmentPoints.length,
      });
      setNewPoint({ title: '', description: '' });
      setShowAddForm(false);
      toast.success('투자 포인트가 추가되었습니다.');
      onRefresh();
    } catch {
      toast.error('추가 실패');
    }
  };

  const handleEdit = (point: InvestmentPoint) => {
    setEditingId(point.id);
    setEditingData({ title: point.title, description: point.description });
  };

  const handleUpdate = async () => {
    if (!editingId || !editingData.title) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        stockId,
        title: editingData.title,
        description: editingData.description,
      });
      setEditingId(null);
      toast.success('투자 포인트가 수정되었습니다.');
      onRefresh();
    } catch {
      toast.error('수정 실패');
    }
  };

  const handleDelete = async (pointId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id: pointId, stockId });
      toast.success('투자 포인트가 삭제되었습니다.');
      onRefresh();
    } catch {
      toast.error('삭제 실패');
    }
  };

  return (
    <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-red-400 tracking-wider">투자 포인트</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
        >
          + 추가
        </button>
      </div>

      <div className="space-y-4">
        {investmentPoints.map((point) => (
          <div key={point.id} className="p-5 rounded-xl border border-slate-700 bg-slate-800/50">
            {editingId === point.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editingData.title}
                  onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                  placeholder="제목"
                />
                <textarea
                  value={editingData.description}
                  onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none"
                  placeholder="설명"
                />
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
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{point.title}</div>
                  <div className="text-xs text-slate-200 mt-1">{point.description}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(point)}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
          <input
            type="text"
            placeholder="제목"
            value={newPoint.title}
            onChange={(e) => setNewPoint({ ...newPoint, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm mb-2"
          />
          <textarea
            placeholder="설명"
            value={newPoint.description}
            onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none mb-2"
          />
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
    </section>
  );
};

export default InvestmentPointSection;
