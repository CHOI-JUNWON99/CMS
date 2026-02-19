import React, { useState, useMemo, useEffect } from 'react';
import { Stock } from '@/shared/types';
import { toast } from '@/shared/stores';
import ImageUploader, { ImageUpload } from './ImageUploader';
import { FeedItem } from './IssueCard';

interface IssueFormData {
  stockId: string;
  stockName: string;
  title: string;
  content: string;
  keywords: string;
  date: string;
  isCMS: boolean;
}

interface EditIssueData extends IssueFormData {
  id: string;
  existingImages: string[];
}

interface IssueModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: IssueFormData | EditIssueData,
    images: ImageUpload[]
  ) => Promise<void>;
  stocks: Stock[];
  editItem?: FeedItem;
  isUploading: boolean;
}

const getTodayDate = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
};

const IssueModal: React.FC<IssueModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  stocks,
  editItem,
  isUploading,
}) => {
  const [formData, setFormData] = useState<IssueFormData | EditIssueData>(
    mode === 'add'
      ? {
          stockId: '',
          stockName: '',
          title: '',
          content: '',
          keywords: '',
          date: getTodayDate(),
          isCMS: false,
        }
      : {
          id: editItem?.id,
          stockId: editItem?.stockId || '',
          stockName: `${editItem?.stockName} (${editItem?.stockTicker})`,
          title: editItem?.title || '',
          content: editItem?.content || '',
          keywords: editItem?.keywords.join(', ') || '',
          date: editItem?.date || '',
          isCMS: editItem?.isCMS || false,
          existingImages: editItem?.images?.map((img) => img.url) || [],
        }
  );
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  // editItem 변경 시 폼 데이터 초기화
  useEffect(() => {
    if (mode === 'edit' && editItem) {
      setFormData({
        id: editItem.id,
        stockId: editItem.stockId,
        stockName: `${editItem.stockName} (${editItem.stockTicker})`,
        title: editItem.title,
        content: editItem.content,
        keywords: editItem.keywords.join(', '),
        date: editItem.date,
        isCMS: editItem.isCMS,
        existingImages: editItem.images?.map((img) => img.url) || [],
      });
    }
  }, [mode, editItem]);

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return stocks;
    const query = stockSearch.toLowerCase();
    return stocks.filter(
      (s) =>
        s.nameKr.toLowerCase().includes(query) ||
        s.ticker.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
    );
  }, [stocks, stockSearch]);

  const handleSelectStock = (stock: Stock) => {
    setFormData({
      ...formData,
      stockId: stock.id,
      stockName: `${stock.nameKr} (${stock.ticker})`,
    });
    setStockSearch('');
    setShowStockDropdown(false);
  };

  const handleRemoveExistingImage = (index: number) => {
    if ('existingImages' in formData) {
      const updated = [...formData.existingImages];
      updated.splice(index, 1);
      setFormData({ ...formData, existingImages: updated });
    }
  };

  const handleClose = () => {
    imageUploads.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageUploads([]);
    setStockSearch('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.stockId || !formData.title || !formData.content || !formData.date) {
      toast.warning('종목, 제목, 내용, 날짜는 필수입니다.');
      return;
    }
    await onSubmit(formData, imageUploads);
  };

  if (!isOpen) return null;

  const isEditMode = mode === 'edit';

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6 my-8">
          <h3 className="text-lg font-black text-white mb-6">
            {isEditMode ? '뉴스 수정' : '새 뉴스 추가'}
          </h3>

          <div className="space-y-4">
            {/* 종목 선택 (추가 모드만) */}
            {isEditMode ? (
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">종목</label>
                <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm">
                  {formData.stockName}
                </div>
              </div>
            ) : (
              <div className="relative">
                <label className="block text-xs font-bold text-slate-200 mb-1">종목 선택 *</label>
                {formData.stockId ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-white text-sm font-bold">{formData.stockName}</span>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, stockId: '', stockName: '' })
                      }
                      className="text-slate-200 hover:text-white"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => {
                        setStockSearch(e.target.value);
                        setShowStockDropdown(true);
                      }}
                      onFocus={() => setShowStockDropdown(true)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      placeholder="종목명 또는 티커로 검색..."
                    />
                    {showStockDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                        {filteredStocks.length > 0 ? (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.id}
                              onClick={() => handleSelectStock(stock)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                            >
                              <span className="text-white text-sm font-bold">
                                {stock.nameKr}
                              </span>
                              <span className="text-slate-200 text-xs ml-2">
                                ({stock.ticker})
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-slate-300 text-sm">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 제목 */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">제목 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                placeholder="뉴스 제목을 입력하세요"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">내용 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                placeholder="뉴스 내용을 입력하세요"
              />
            </div>

            {/* 이미지 업로드 */}
            <ImageUploader
              images={imageUploads}
              onImagesChange={setImageUploads}
              existingImages={'existingImages' in formData ? formData.existingImages : []}
              onExistingImageRemove={isEditMode ? handleRemoveExistingImage : undefined}
              label={isEditMode ? '새 이미지 추가' : '이미지 (선택, 여러 장 가능)'}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  키워드 (쉼표 구분)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="AI, 클라우드, 실적"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  날짜 (YY/MM/DD) *
                </label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="25/01/29"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCMS}
                onChange={(e) => setFormData({ ...formData, isCMS: e.target.checked })}
                className="rounded border-slate-600"
              />
              <span className="text-sm text-slate-200">CMS증권 코멘트</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 ${
                isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isUploading ? (isEditMode ? '저장 중...' : '업로드 중...') : isEditMode ? '저장' : '추가'}
            </button>
          </div>
        </div>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showStockDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowStockDropdown(false)} />
      )}
    </>
  );
};

export default IssueModal;
