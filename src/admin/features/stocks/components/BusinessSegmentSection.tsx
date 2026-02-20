import React, { useState } from 'react';
import {
  useAddBusinessSegment,
  useUpdateBusinessSegment,
  useDeleteBusinessSegment,
} from '@/features/stocks';
import { toast, confirm } from '@/shared/stores';
import IconPickerModal from './IconPickerModal';

interface BusinessSegment {
  id: string;
  name: string;
  nameKr: string;
  value: number;
  iconUrls?: string[];
}

interface Props {
  stockId: string;
  businessSegments: BusinessSegment[];
  onRefresh: () => void;
}

const MAX_ICONS = 3;

// 컴포넌트 외부에 정의하여 리렌더링 시 재생성 방지
const IconsPreview: React.FC<{
  iconUrls: string[];
  onRemove: (index: number) => void;
  onOpenPicker: () => void;
  canAdd: boolean;
}> = ({ iconUrls, onRemove, onOpenPicker, canAdd }) => (
  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
    <label className="block text-[10px] text-slate-400 mb-2">
      아이콘 (최대 {MAX_ICONS}개)
    </label>
    <div className="flex items-center gap-2 flex-wrap">
      {iconUrls.map((url, index) => (
        <div key={index} className="relative">
          <img
            src={url}
            alt=""
            className="w-12 h-12 rounded-lg object-cover border border-slate-600"
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          onClick={onOpenPicker}
          className="w-12 h-12 rounded-lg bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center hover:border-slate-500 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

const BusinessSegmentSection: React.FC<Props> = ({ stockId, businessSegments, onRefresh }) => {
  const addMutation = useAddBusinessSegment();
  const updateMutation = useUpdateBusinessSegment();
  const deleteMutation = useDeleteBusinessSegment();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: '',
    nameKr: '',
    value: 0,
    iconUrls: [] as string[],
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    name: '',
    nameKr: '',
    value: 0,
    iconUrls: [] as string[],
  });

  const [showIconPicker, setShowIconPicker] = useState<'new' | 'edit' | null>(null);

  const handleAdd = async () => {
    if (!newSegment.nameKr) return;
    try {
      await addMutation.mutateAsync({
        stockId,
        name: newSegment.name,
        nameKr: newSegment.nameKr,
        value: newSegment.value,
        iconUrls: newSegment.iconUrls.length > 0 ? newSegment.iconUrls : undefined,
        sortOrder: businessSegments.length,
      });
      setNewSegment({ name: '', nameKr: '', value: 0, iconUrls: [] });
      setShowAddForm(false);
      toast.success('사업 부문이 추가되었습니다.');
      onRefresh();
    } catch {
      toast.error('추가 실패');
    }
  };

  const handleEdit = (seg: BusinessSegment) => {
    setEditingId(seg.id);
    setEditingData({
      name: seg.name,
      nameKr: seg.nameKr,
      value: seg.value,
      iconUrls: seg.iconUrls || [],
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !editingData.nameKr) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        stockId,
        name: editingData.name,
        nameKr: editingData.nameKr,
        value: editingData.value,
        iconUrls: editingData.iconUrls.length > 0 ? editingData.iconUrls : undefined,
      });
      setEditingId(null);
      toast.success('사업 부문이 수정되었습니다.');
      onRefresh();
    } catch {
      toast.error('수정 실패');
    }
  };

  const handleDelete = async (segmentId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id: segmentId, stockId });
      toast.success('사업 부문이 삭제되었습니다.');
      onRefresh();
    } catch {
      toast.error('삭제 실패');
    }
  };

  const handleSelectIcon = (iconUrl: string) => {
    if (showIconPicker === 'edit') {
      if (editingData.iconUrls.length < MAX_ICONS && !editingData.iconUrls.includes(iconUrl)) {
        setEditingData(prev => ({ ...prev, iconUrls: [...prev.iconUrls, iconUrl] }));
      }
    } else {
      if (newSegment.iconUrls.length < MAX_ICONS && !newSegment.iconUrls.includes(iconUrl)) {
        setNewSegment(prev => ({ ...prev, iconUrls: [...prev.iconUrls, iconUrl] }));
      }
    }
    setShowIconPicker(null);
  };

  const removeIcon = (target: 'new' | 'edit', index: number) => {
    if (target === 'edit') {
      setEditingData(prev => ({
        ...prev,
        iconUrls: prev.iconUrls.filter((_, i) => i !== index),
      }));
    } else {
      setNewSegment(prev => ({
        ...prev,
        iconUrls: prev.iconUrls.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <>
      <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-red-400 tracking-wider">
            사업별 매출 비중 (Revenue Mix)
          </h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
          >
            + 추가
          </button>
        </div>

        <div className="space-y-4">
          {businessSegments.map(seg => (
            <div
              key={seg.id}
              className="p-5 rounded-xl border border-slate-700 bg-slate-800/50"
            >
              {editingId === seg.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingData.nameKr}
                      onChange={(e) =>
                        setEditingData({ ...editingData, nameKr: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                      placeholder="제목"
                    />
                    <input
                      type="text"
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData({ ...editingData, name: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                      placeholder="소제목"
                    />
                  </div>
                  <input
                    type="number"
                    value={editingData.value || ''}
                    onChange={(e) =>
                      setEditingData({ ...editingData, value: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
                    placeholder="비율 %"
                  />
                  <IconsPreview
                    iconUrls={editingData.iconUrls}
                    onRemove={(index) => removeIcon('edit', index)}
                    onOpenPicker={() => setShowIconPicker('edit')}
                    canAdd={editingData.iconUrls.length < MAX_ICONS}
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
                <div className="flex items-center gap-3">
                  {/* 다중 아이콘 표시 */}
                  <div className="flex gap-1 shrink-0">
                    {seg.iconUrls && seg.iconUrls.length > 0 ? (
                      seg.iconUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-slate-600"
                        />
                      ))
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-white text-sm">{seg.nameKr}</span>
                    <span className="text-slate-300 text-xs ml-2">({seg.name})</span>
                  </div>
                  <span className="text-slate-200 text-sm font-bold">{seg.value}%</span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(seg)}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(seg.id)}
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
          <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="제목"
                value={newSegment.nameKr}
                onChange={(e) => setNewSegment({ ...newSegment, nameKr: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
              <input
                type="text"
                placeholder="소제목"
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
            <input
              type="number"
              placeholder="비율 %"
              value={newSegment.value || ''}
              onChange={(e) => setNewSegment({ ...newSegment, value: Number(e.target.value) })}
              className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
            />
            <IconsPreview
              iconUrls={newSegment.iconUrls}
              onRemove={(index) => removeIcon('new', index)}
              onOpenPicker={() => setShowIconPicker('new')}
              canAdd={newSegment.iconUrls.length < MAX_ICONS}
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
                onClick={() => {
                  setShowAddForm(false);
                  setNewSegment({ name: '', nameKr: '', value: 0, iconUrls: [] });
                }}
                className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>

      <IconPickerModal
        isOpen={showIconPicker !== null}
        onClose={() => setShowIconPicker(null)}
        onSelectIcon={handleSelectIcon}
      />
    </>
  );
};

export default BusinessSegmentSection;
