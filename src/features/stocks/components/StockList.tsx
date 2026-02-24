import React from 'react';
import { Stock, SortKey, SortDirection } from '@/shared/types';
import { getSimplifiedSector, formatMarketCapShort } from '@/shared/utils';
// 주식 목록 컴포넌트
interface StockListProps {
  stocks: Stock[];
  onStockSelect: (stock: Stock) => void;
  isDarkMode: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}

const StockList: React.FC<StockListProps> = ({
  stocks,
  onStockSelect,
  isDarkMode,
  sortKey,
  sortDirection,
  onSort
}) => {
  const SortIndicator = ({ active }: { active: boolean }) => (
    <div className="ml-1.5 flex flex-col items-center justify-center opacity-100 shrink-0">
      <svg className={`w-2 h-2 mb-[-1px] transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg>
      <svg className={`w-2 h-2 mt-[-1px] transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 01-1.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
    </div>
  );

  const HeaderButton = ({ label, targetKey, className }: { label: string, targetKey: SortKey, className: string }) => {
    const active = sortKey === targetKey;
    return (
      <button onClick={() => onSort(targetKey)} className={`${className} flex items-center hover:opacity-70 transition-opacity group py-1 outline-none`}>
        <span className={`transition-colors font-bold whitespace-nowrap text-[11px] tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{label}</span>
        <SortIndicator active={active} />
      </button>
    );
  };

  let lastSector = "";

  return (
    <div className="space-y-4">
      {/* Header - 너비: 7% / 15% / 12% / flex-1 / 12% / 8% */}
      <div className={`hidden lg:flex px-6 py-2 items-center text-[11px] uppercase tracking-widest`}>
        <div className="w-[7%] shrink-0 flex items-center pl-2"><span className={`font-bold transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>TICKER</span></div>
        <div className="w-[15%] shrink-0 flex items-center pl-10"><HeaderButton label="NAME" targetKey="name" className="justify-start" /></div>
        <div className="w-[12%] shrink-0 flex items-center pl-6"><HeaderButton label="SECTOR" targetKey="sector" className="justify-start" /></div>
        <div className="flex-1 pl-[13%] flex justify-start"><span className={`font-bold transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>INVESTMENT POINTS</span></div>
        <div className="w-[12%] shrink-0 flex justify-center"><HeaderButton label="MARKET CAP" targetKey="marketCapValue" className="justify-center" /></div>
        <div className="w-[8%] shrink-0 flex justify-end pr-2"><HeaderButton label="YTD" targetKey="returnRate" className="justify-end" /></div>
      </div>

      <div className="flex flex-col gap-4 mt-1">
        {stocks.map((stock) => {
          const simplifiedSector = getSimplifiedSector(stock.sector);
          const showDivider = sortKey === 'sector' && simplifiedSector !== lastSector;
          if (showDivider) lastSector = simplifiedSector;

          return (
            <React.Fragment key={stock.id}>
              {showDivider && (
                <div className="mt-8 mb-2">
                  <div className="flex items-center gap-4 px-6">
                    <span className={`text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                      {simplifiedSector}
                    </span>
                    <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  </div>
                </div>
              )}
              <div
                onClick={() => onStockSelect(stock)}
                className={`group relative flex flex-col lg:flex-row lg:items-center px-6 py-4 lg:px-6 lg:py-3 rounded-[16px] transition-all duration-500 cursor-pointer transform hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-[#112240] border border-slate-600 hover:border-primary-light shadow-xl'
                    : 'bg-white border border-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:border-primary/40'
                }`}
              >
                {/* TICKER 영역 - 7% */}
                <div className="hidden lg:flex lg:w-[7%] lg:shrink-0 items-center flex-wrap gap-1">
                  {(stock.tickers && stock.tickers.length > 1 ? stock.tickers : [stock.ticker]).map((ticker, idx) => (
                    <span key={idx} className={`text-[11px] font-mono font-black tracking-tight px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>{ticker}</span>
                  ))}
                </div>

                {/* NAME 영역 - 15% */}
                <div className="flex justify-between items-start lg:items-center lg:w-[14%] lg:shrink-0 lg:pl-6">
                  <div className="flex flex-col">
                    <span className={`font-black text-lg lg:text-[16px] leading-tight mb-1 transition-colors whitespace-pre-line ${isDarkMode ? 'text-white' : 'text-gray-900 group-hover:text-primary'}`}>{stock.nameKr}</span>
                    <span className={`text-[10px] lg:text-[11px] font-bold line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{stock.name}</span>
                    {/* 모바일에서만 티커 표시 */}
                    <div className="lg:hidden flex flex-wrap gap-1 mt-1">
                      {(stock.tickers && stock.tickers.length > 1 ? stock.tickers : [stock.ticker]).map((ticker, idx) => (
                        <span key={idx} className={`text-[10px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary/60'}`}>{ticker}</span>
                      ))}
                    </div>
                  </div>
                  {/* 모바일 수익률 */}
                  <div className="lg:hidden flex flex-col items-end">
                    <div className={`text-2xl font-black ${(stock.returnRate || 0) >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>{(stock.returnRate || 0) > 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(1)}%</div>
                    <div className={`text-[15px] font-bold mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {formatMarketCapShort(stock.marketCap)}
                    </div>
                  </div>
                </div>

                {/* SECTOR 영역 - 12% */}
                <div className="hidden lg:flex lg:w-[12%] lg:shrink-0 justify-start pl-6">
                  <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${isDarkMode ? 'bg-slate-800 text-blue-200 border-slate-600' : 'bg-white text-gray-700 border-gray-200 shadow-sm group-hover:border-primary/30 group-hover:text-primary'}`}>
                    {stock.sector}
                  </span>
                </div>

                {/* INVESTMENT POINTS 영역 - flex-1 (헤더 아래 정렬) */}
                <div className="mt-4 lg:mt-0 flex-1 lg:pl-[10%] lg:pr-4 flex lg:justify-start">
                  <div className="flex flex-col gap-1">
                    {stock.investmentPoints?.slice(0, 3).map((point, idx) => (
                      <div key={idx} className="flex items-start">
                        <span className={`text-[12px] font-bold tracking-tight transition-all ${isDarkMode ? 'text-slate-300' : 'text-gray-800'}`}>
                          # {point.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MARKET CAP 영역 - 12% (가운데 정렬) */}
                <div className={`hidden lg:flex lg:w-[12%] lg:shrink-0 justify-center text-[15px] font-medium whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatMarketCapShort(stock.marketCap)}
                </div>

                {/* RETURN 영역 - 8% (오른쪽 정렬) */}
                <div className={`hidden lg:flex lg:w-[8%] lg:shrink-0 justify-end pr-2 font-bold text-[15px] ${
                  (stock.returnRate || 0) >= 0
                    ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                    : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                }`}>
                  {(stock.returnRate || 0) > 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(1)}%
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StockList;
