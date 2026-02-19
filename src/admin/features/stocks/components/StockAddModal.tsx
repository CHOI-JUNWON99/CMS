import React from 'react';
import { NewStockData } from './types';

interface StockAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newStock: NewStockData;
  onNewStockChange: (data: NewStockData) => void;
  getIdFromTicker: (ticker: string) => string;
}

const StockAddModal: React.FC<StockAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newStock,
  onNewStockChange,
  getIdFromTicker,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
        <h3 className="text-lg font-black text-white mb-6">새 종목 추가</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">티커 *</label>
            <input
              type="text"
              value={newStock.ticker}
              onChange={(e) => onNewStockChange({ ...newStock, ticker: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              placeholder="002050.SZ"
            />
            {newStock.ticker && (
              <p className="text-[10px] text-slate-400 mt-1">
                자동 생성 ID: <span className="text-emerald-400 font-mono">{getIdFromTicker(newStock.ticker)}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">영문명</label>
              <input
                type="text"
                value={newStock.name}
                onChange={(e) => onNewStockChange({ ...newStock, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">한글명 *</label>
              <input
                type="text"
                value={newStock.nameKr}
                onChange={(e) => onNewStockChange({ ...newStock, nameKr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                placeholder="종목명"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">섹터</label>
            <input
              type="text"
              value={newStock.sector}
              onChange={(e) => onNewStockChange({ ...newStock, sector: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              placeholder="자동차 부품"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">기업 설명</label>
            <textarea
              value={newStock.description}
              onChange={(e) => onNewStockChange({ ...newStock, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
              placeholder="기업 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">시가총액</label>
              <input
                type="text"
                value={newStock.marketCap}
                onChange={(e) => onNewStockChange({ ...newStock, marketCap: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                placeholder="43조 5,892억원"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">수익률 (%)</label>
              <input
                type="number"
                step="0.1"
                value={newStock.returnRate || ''}
                onChange={(e) => onNewStockChange({ ...newStock, returnRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!newStock.ticker || !newStock.nameKr}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAddModal;
