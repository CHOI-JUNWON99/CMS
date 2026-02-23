import React from 'react';
import { Portfolio } from './types';

interface PortfolioSummaryCardProps {
  portfolio: Portfolio;
  stockCount: number;
  totalReturnRate: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetActive: () => void;
  onDeactivate: () => void;
}

const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({
  portfolio,
  stockCount,
  totalReturnRate,
  onEdit,
  onDelete,
  onSetActive,
  onDeactivate,
}) => {
  return (
    <div className="relative rounded-2xl border bg-[#112240] border-slate-700 shadow-xl p-6 mb-10 overflow-hidden">
      {/* 상단: 타이틀 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-black text-white mb-1">{portfolio.name}</h2>
          {portfolio.description && (
            <p className="text-sm text-slate-200">{portfolio.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {portfolio.isActive ? (
            <button
              onClick={onDeactivate}
              className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-600 transition-all"
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }} />
              활성화 중
            </button>
          ) : (
            <button
              onClick={onSetActive}
              className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-600 transition-all"
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#000000', flexShrink: 0 }} />
              비활성화 중
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            수정
          </button>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 text-xs"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="flex items-center gap-8 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">종목 수</span>
          <span className="text-lg font-black text-white">{stockCount}</span>
        </div>
        <div className="w-px h-6 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">수익률</span>
          <span className={`text-lg font-black ${totalReturnRate >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
            {totalReturnRate >= 0 ? '+' : ''}{totalReturnRate.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummaryCard;
