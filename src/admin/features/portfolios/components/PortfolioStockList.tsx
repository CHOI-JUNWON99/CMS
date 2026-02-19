import React from 'react';
import { StockItem } from './types';

interface PortfolioStockListProps {
  stocks: StockItem[];
  updatingIds: Set<string>;
  onRemove: (stockId: string) => void;
  formatMarketCap: (capStr: string) => string;
}

const PortfolioStockList: React.FC<PortfolioStockListProps> = ({
  stocks,
  updatingIds,
  onRemove,
  formatMarketCap,
}) => {
  return (
    <div className="mb-10">
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        포트폴리오 구성 종목
        <span className="text-slate-300 font-medium">({stocks.length})</span>
      </h3>

      {stocks.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-900/30 border border-slate-800">
          <p className="text-slate-300 font-bold">포트폴리오에 포함된 종목이 없습니다.</p>
          <p className="text-slate-600 text-sm mt-1">아래에서 종목을 추가해주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stocks.map(stock => (
            <div
              key={stock.id}
              className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#112240] border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white truncate">{stock.nameKr}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                    {stock.ticker}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-300">{formatMarketCap(stock.marketCap)}</span>
                  <span className={`font-bold ${(stock.returnRate || 0) >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                    {(stock.returnRate || 0) >= 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(stock.id)}
                disabled={updatingIds.has(stock.id)}
                className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50 flex-shrink-0"
                title="포트폴리오에서 제외"
              >
                {updatingIds.has(stock.id) ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioStockList;
