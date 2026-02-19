import React from 'react';
import { StockItem } from './types';

interface AvailableStockListProps {
  stocks: StockItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  updatingIds: Set<string>;
  onAdd: (stockId: string) => void;
  formatMarketCap: (capStr: string) => string;
}

const AvailableStockList: React.FC<AvailableStockListProps> = ({
  stocks,
  searchQuery,
  onSearchChange,
  updatingIds,
  onAdd,
  formatMarketCap,
}) => {
  return (
    <div>
      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        미포함 종목
        <span className="text-slate-300 font-medium">({stocks.length})</span>
      </h3>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="종목명 또는 티커로 검색..."
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-600"
        />
      </div>

      {stocks.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-slate-900/30 border border-slate-800">
          <p className="text-slate-300 font-bold">
            {searchQuery ? '검색 결과가 없습니다.' : '모든 종목이 포트폴리오에 포함되어 있습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stocks.map(stock => (
            <div
              key={stock.id}
              className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-300 truncate">{stock.nameKr}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                    {stock.ticker}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600">{formatMarketCap(stock.marketCap)}</span>
                  <span className={`font-bold ${(stock.returnRate || 0) >= 0 ? 'text-rose-400/60' : 'text-blue-400/60'}`}>
                    {(stock.returnRate || 0) >= 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => onAdd(stock.id)}
                disabled={updatingIds.has(stock.id)}
                className="p-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all disabled:opacity-50 flex-shrink-0"
                title="포트폴리오에 추가"
              >
                {updatingIds.has(stock.id) ? (
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
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

export default AvailableStockList;
