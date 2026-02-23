import React from 'react';
import { Portfolio, NewPortfolioData, Client } from './types';

interface PortfolioModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  clients: Client[];
  isSubmitting: boolean;
  // For add mode
  newPortfolio?: NewPortfolioData;
  onNewPortfolioChange?: (data: NewPortfolioData) => void;
  // For edit mode
  editingPortfolio?: Portfolio | null;
  onEditingPortfolioChange?: (portfolio: Portfolio) => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  clients,
  isSubmitting,
  newPortfolio,
  onNewPortfolioChange,
  editingPortfolio,
  onEditingPortfolioChange,
}) => {
  if (!isOpen) return null;

  const isEditMode = mode === 'edit';
  const data = isEditMode ? editingPortfolio : newPortfolio;

  if (!data) return null;

  const handleChange = (field: string, value: string | number | null) => {
    if (isEditMode && editingPortfolio && onEditingPortfolioChange) {
      onEditingPortfolioChange({ ...editingPortfolio, [field]: value });
    } else if (!isEditMode && newPortfolio && onNewPortfolioChange) {
      onNewPortfolioChange({ ...newPortfolio, [field]: value });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
        <h3 className="text-lg font-black text-white mb-6">
          {isEditMode ? '포트폴리오 수정' : '새 포트폴리오'}
        </h3>

        <div className="space-y-4">
          {clients.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                {isEditMode ? '소속' : '클라이언트 *'}
              </label>
              <select
                value={isEditMode ? (editingPortfolio?.clientId || '') : (newPortfolio?.clientId || '')}
                onChange={(e) => handleChange('clientId', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
              >
                <option value="">{isEditMode ? '미지정' : '클라이언트 선택'}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {isEditMode && (
                <p className="text-[10px] text-slate-400 mt-1">
                  소속을 변경하면 해당 소속의 사용자만 이 포트폴리오를 볼 수 있습니다.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
            <input
              type="text"
              value={isEditMode ? editingPortfolio?.name : newPortfolio?.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
              placeholder="CMS X 쿼터백 차이나 미래성장랩"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">설명</label>
            <textarea
              value={isEditMode ? editingPortfolio?.description : newPortfolio?.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-slate-600"
              placeholder="포트폴리오 설명 (선택)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (isEditMode ? '저장 중...' : '생성 중...') : (isEditMode ? '저장' : '생성')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
