import React, { useState, useEffect } from 'react';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { convertToWebP } from '@/shared/lib/imageUtils';
import { toast, confirm } from '@/shared/stores';

interface SegmentIcon {
  id: string;
  name: string;
  icon_url: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconUrl: string) => void;
}

const IconPickerModal: React.FC<Props> = ({ isOpen, onClose, onSelectIcon }) => {
  const [iconLibrary, setIconLibrary] = useState<SegmentIcon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newIconName, setNewIconName] = useState('');
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchIconLibrary();
    }
  }, [isOpen]);

  const fetchIconLibrary = async () => {
    const { data } = await supabase.from('segment_icons').select('*').order('name');
    if (data) setIconLibrary(data);
  };

  const filteredIcons = iconLibrary.filter(icon =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadIcon = async (file: File, iconName: string) => {
    setIsUploading(true);
    try {
      const webpBlob = await convertToWebP(file, 0.85);
      const fileName = `segment-${Date.now()}.webp`;
      const filePath = `segments/${fileName}`;

      const { error: uploadError } = await getAdminSupabase().storage
        .from('images')
        .upload(filePath, webpBlob, {
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = getAdminSupabase().storage.from('images').getPublicUrl(filePath);

      const { data: savedIcon, error: dbError } = await getAdminSupabase()
        .from('segment_icons')
        .insert({ name: iconName, icon_url: publicUrl })
        .select()
        .single();

      if (!dbError && savedIcon) {
        setIconLibrary(prev => [...prev, savedIcon].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setNewIconName('');
      onSelectIcon(publicUrl);
      onClose();
      toast.success('아이콘이 업로드되었습니다.');
    } catch (err) {
      console.error('아이콘 업로드 실패:', err);
      toast.error('아이콘 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteIcon = async (icon: SegmentIcon, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirm.custom({
      title: '아이콘 삭제',
      message: `"${icon.name}" 아이콘을 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      // Storage에서 이미지 삭제
      const urlParts = icon.icon_url.split('/');
      const filePath = `segments/${urlParts[urlParts.length - 1]}`;
      await getAdminSupabase().storage.from('images').remove([filePath]);

      // DB에서 삭제
      const { error } = await getAdminSupabase()
        .from('segment_icons')
        .delete()
        .eq('id', icon.id);

      if (error) throw error;

      setIconLibrary(prev => prev.filter(i => i.id !== icon.id));
      toast.success('아이콘이 삭제되었습니다.');
    } catch (err) {
      console.error('아이콘 삭제 실패:', err);
      toast.error('아이콘 삭제에 실패했습니다.');
    }
  };

  const handleEditIcon = (icon: SegmentIcon, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIconId(icon.id);
    setEditingName(icon.name);
  };

  const handleSaveEdit = async (iconId: string) => {
    if (!editingName.trim()) {
      toast.warning('아이콘 이름을 입력해주세요.');
      return;
    }

    try {
      const { error } = await getAdminSupabase()
        .from('segment_icons')
        .update({ name: editingName.trim() })
        .eq('id', iconId);

      if (error) throw error;

      setIconLibrary(prev =>
        prev
          .map(i => (i.id === iconId ? { ...i, name: editingName.trim() } : i))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingIconId(null);
      toast.success('아이콘 이름이 수정되었습니다.');
    } catch (err) {
      console.error('아이콘 수정 실패:', err);
      toast.error('아이콘 수정에 실패했습니다.');
    }
  };

  const handleSelectFromLibrary = (iconUrl: string) => {
    onSelectIcon(iconUrl);
    onClose();
    setSearchQuery('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일명에서 확장자 제거하여 아이콘 이름으로 사용
    let iconName = newIconName.trim();
    if (!iconName) {
      const fileName = file.name;
      iconName = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거
      setNewIconName(iconName);
    }

    if (iconName) {
      handleUploadIcon(file, iconName);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-white">아이콘 선택</h3>
            <button
              onClick={() => {
                onClose();
                setSearchQuery('');
                setEditingIconId(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="아이콘 이름으로 검색..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredIcons.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {filteredIcons.map(icon => (
                <div
                  key={icon.id}
                  className="relative group"
                >
                  {editingIconId === icon.id ? (
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-700 border border-blue-500">
                      <img
                        src={icon.icon_url}
                        alt={icon.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-1 py-0.5 rounded bg-slate-800 border border-slate-600 text-white text-[10px] text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(icon.id);
                          if (e.key === 'Escape') setEditingIconId(null);
                        }}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit(icon.id)}
                          className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px]"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingIconId(null)}
                          className="px-2 py-0.5 rounded bg-slate-600 text-white text-[10px]"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectFromLibrary(icon.icon_url)}
                      className="w-full flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all"
                    >
                      <img
                        src={icon.icon_url}
                        alt={icon.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">
                        {icon.name}
                      </span>
                    </button>
                  )}

                  {/* 수정/삭제 버튼 */}
                  {editingIconId !== icon.id && (
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditIcon(icon, e)}
                        className="w-5 h-5 rounded bg-blue-600/90 text-white flex items-center justify-center hover:bg-blue-500"
                        title="이름 수정"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteIcon(icon, e)}
                        className="w-5 h-5 rounded bg-red-600/90 text-white flex items-center justify-center hover:bg-red-500"
                        title="삭제"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              {searchQuery ? '검색 결과가 없습니다' : '저장된 아이콘이 없습니다'}
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="border-t border-slate-700 pt-4 mt-4 mb-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-400 space-y-1">
              <p>• 아이콘 이름 미입력 시 파일 선택하면 파일명이 자동 입력됩니다. (예: 자동차.png → 자동차)</p>
              <p>• 아이콘에 마우스를 올리면 수정/삭제 버튼이 표시됩니다.</p>
            </div>
          </div>

          {/* 새 아이콘 업로드 */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs font-bold text-slate-300 mb-3">
              새 아이콘 업로드 (PNG → WebP 자동 변환)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIconName}
                onChange={(e) => setNewIconName(e.target.value)}
                placeholder="아이콘 이름 (예: 자동차)"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              />
              <label className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 cursor-pointer transition-all">
                파일 선택
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-slate-300">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                WebP 변환 및 업로드 중...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconPickerModal;
