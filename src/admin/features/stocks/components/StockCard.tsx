import React from 'react';
import { Stock } from '@/shared/types';

interface StockCardProps {
  stock: Stock;
  onClick: () => void;
  getShortSector: (sector: string) => string;
}

const StockCard: React.FC<StockCardProps> = ({
  stock,
  onClick,
  getShortSector,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#112240] border border-slate-800 hover:border-slate-600 hover:bg-[#1a2d4d] transition-all cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white truncate">{stock.nameKr}</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
            {stock.ticker}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-600 px-1.5 py-0.5 rounded bg-slate-800/50">
            {getShortSector(stock.sector)}
          </span>
          <span className="text-slate-300">{stock.marketCap || '-'}</span>
          <span className={`font-bold ${(stock.returnRate ?? 0) >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
            {(stock.returnRate ?? 0) >= 0 ? '+' : ''}{(stock.returnRate ?? 0).toFixed(1)}%
          </span>
        </div>
      </div>
      <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
};

export default StockCard;
