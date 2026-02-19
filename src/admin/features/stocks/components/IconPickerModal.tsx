import React, { useState, useEffect } from 'react';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { convertToWebP } from '@/shared/lib/imageUtils';
import { toast } from '@/shared/stores';

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

  const handleSelectFromLibrary = (iconUrl: string) => {
    onSelectIcon(iconUrl);
    onClose();
    setSearchQuery('');
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
                <button
                  key={icon.id}
                  onClick={() => handleSelectFromLibrary(icon.icon_url)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all"
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              {searchQuery ? '검색 결과가 없습니다' : '저장된 아이콘이 없습니다'}
            </div>
          )}

          {/* 새 아이콘 업로드 */}
          <div className="border-t border-slate-700 pt-4 mt-4">
            <p className="text-xs font-bold text-slate-300 mb-3">
              새 아이콘 업로드 (PNG → WebP 자동 변환)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                id="newIconName"
                placeholder="아이콘 이름 (예: 자동차)"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              />
              <label className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 cursor-pointer transition-all">
                파일 선택
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const nameInput = document.getElementById('newIconName') as HTMLInputElement;
                    const iconName = nameInput?.value.trim();
                    if (file && iconName) {
                      handleUploadIcon(file, iconName);
                    } else if (file && !iconName) {
                      toast.warning('아이콘 이름을 입력해주세요.');
                      e.target.value = '';
                    }
                  }}
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
