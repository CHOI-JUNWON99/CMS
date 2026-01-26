
import React from 'react';
import { Stock, SortKey, SortDirection } from '../types';

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
  
  const getSimplifiedSector = (sector: string) => {
    if (sector.includes('반도체')) return '반도체';
    if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
    if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재 / 자동화';
    if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
    if (sector.includes('온라인') || sector.includes('서비스')) return '서비스 / 플랫폼';
    if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷') || sector.includes('장치')) return 'IT / 인프라';
    return sector;
  };

  const formatMarketCap = (capStr: string) => {
    const parts = capStr.split(' ');
    if (parts.length < 2) return <span className={isDarkMode ? 'text-slate-100' : 'text-gray-900'}>{capStr}</span>;
    const joPart = parts[0].replace('조', '');
    const okPart = parts[1].replace('억원', '');
    const textColor = isDarkMode ? 'text-slate-100 font-black' : 'text-gray-900 font-black';
    return (
      <span className={`inline-flex items-baseline gap-1 ${textColor} text-[12px] md:text-[13px]`}>
        <span className="tracking-tighter">{joPart}</span>
        <span className="text-[10px] md:text-[11px] font-bold ml-0.5">조</span>
        <span className="tracking-tighter ml-2">{okPart}</span>
        <span className="text-[10px] md:text-[11px] font-bold ml-0.5">억</span>
      </span>
    );
  };

  const SortIndicator = ({ active }: { active: boolean }) => (
    <div className="ml-1.5 flex flex-col items-center justify-center opacity-100 shrink-0">
      <svg className={`w-2.5 h-2.5 mb-[-1.5px] transition-colors ${active && sortDirection === 'ASC' ? (isDarkMode ? 'text-primary-accent' : 'text-primary') : (isDarkMode ? 'text-slate-600' : 'text-gray-400')}`} fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg>
      <svg className={`w-2.5 h-2.5 mt-[-1.5px] transition-colors ${active && sortDirection === 'DESC' ? (isDarkMode ? 'text-primary-accent' : 'text-primary') : (isDarkMode ? 'text-slate-600' : 'text-gray-400')}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 01-1.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
    </div>
  );

  const HeaderButton = ({ label, targetKey, className }: { label: string, targetKey: SortKey, className: string }) => {
    const active = sortKey === targetKey;
    return (
      <button onClick={() => onSort(targetKey)} className={`${className} flex items-center hover:opacity-70 transition-opacity group py-2 outline-none`}>
        <span className={`transition-colors font-black whitespace-nowrap text-[12px] tracking-widest ${active ? (isDarkMode ? 'text-primary-accent' : 'text-primary') : (isDarkMode ? 'text-slate-400' : 'text-gray-500')}`}>{label}</span>
        <SortIndicator active={active} />
      </button>
    );
  };

  let lastSector = "";

  return (
    <div className="space-y-4 md:space-y-3">
      <div className={`hidden md:flex px-10 py-4 items-center text-[12px] uppercase tracking-widest border-b-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="w-[22%]"><HeaderButton label="NAME" targetKey="name" className="justify-start" /></div>
        <div className="w-[18%]"><HeaderButton label="SECTOR" targetKey="sector" className="justify-start" /></div>
        <div className="flex-1 px-4"><span className={`font-black transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>INVESTMENT POINTS</span></div>
        <div className="w-[20%] flex justify-end pr-2"><HeaderButton label="MARKET CAP" targetKey="marketCapValue" className="justify-end" /></div>
        <div className="w-[12%] flex justify-end"><HeaderButton label="DAILY" targetKey="change" className="justify-end" /></div>
        <div className="w-[5%]"></div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {stocks.map((stock) => {
          const simplifiedSector = getSimplifiedSector(stock.sector);
          const showDivider = sortKey === 'sector' && simplifiedSector !== lastSector;
          if (showDivider) lastSector = simplifiedSector;

          return (
            <React.Fragment key={stock.id}>
              {showDivider && (
                <div className="mt-12 mb-6">
                  <div className="flex items-center gap-6 px-4">
                    <span className={`text-[13px] font-black uppercase tracking-[0.3em] whitespace-nowrap px-4 py-1.5 rounded-full border-2 ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-600' : 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm'}`}>
                      {simplifiedSector}
                    </span>
                    <div className={`flex-1 h-[2px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  </div>
                </div>
              )}
              <div 
                onClick={() => onStockSelect(stock)}
                className={`group relative flex flex-col md:flex-row md:items-center px-6 py-6 md:px-10 md:py-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                  isDarkMode ? 'bg-[#112240] border-slate-600 hover:border-primary-accent hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-gray-300 hover:border-primary hover:shadow-2xl'
                }`}
              >
                {/* Side Indicator - Navy */}
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-primary rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                
                <div className="flex justify-between items-start md:w-[22%] md:block">
                  <div className="flex flex-col">
                    <span className={`text-[10px] md:text-[11px] font-mono font-black tracking-widest uppercase mb-1 ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>{stock.ticker}</span>
                    <span className={`font-black text-xl md:text-[18px] leading-tight transition-colors ${isDarkMode ? 'text-white group-hover:text-primary-accent' : 'text-gray-900 group-hover:text-primary'}`}>{stock.name}</span>
                    <span className={`text-sm md:text-xs font-bold mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{stock.nameKr}</span>
                  </div>
                  <div className="md:hidden flex flex-col items-end">
                    <div className={`text-2xl font-black ${stock.change >= 0 ? 'text-primary' : 'text-cyan-600'}`}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</div>
                    <div className="mt-1">{formatMarketCap(stock.marketCap)}</div>
                  </div>
                </div>

                <div className="hidden md:flex md:w-[18%] shrink-0">
                  <span className={`inline-block text-[11px] font-black px-3 py-1 rounded-lg border-2 ${isDarkMode ? 'bg-slate-800 text-blue-200 border-slate-600' : 'bg-blue-50 text-primary border-blue-200 shadow-sm'}`}>
                    {stock.sector}
                  </span>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:flex-1 md:items-center">
                  <div className="flex-1 md:px-6 flex flex-wrap gap-x-3 gap-y-2">
                    {stock.investmentPoints?.map((kw, idx) => (
                      <span key={idx} className={`text-[12px] md:text-[13px] font-black transition-all group-hover:translate-x-0.5 ${isDarkMode ? 'text-blue-300' : 'text-primary'}`}>#{kw}</span>
                    ))}
                  </div>
                  <div className="hidden md:flex w-[20%] justify-end pr-2">{formatMarketCap(stock.marketCap)}</div>
                  <div className={`hidden md:block w-[12%] text-right font-black text-[18px] md:text-[20px] ${stock.change >= 0 ? (isDarkMode ? 'text-primary-accent' : 'text-primary') : (isDarkMode ? 'text-cyan-400' : 'text-cyan-600')}`}>
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </div>
                </div>

                <div className="hidden md:block w-[5%] text-right">
                  <span className={`transition-all duration-300 inline-block transform group-hover:translate-x-2 ${isDarkMode ? 'text-slate-500 group-hover:text-primary-accent' : 'text-gray-300 group-hover:text-primary'}`}>
                    <svg className="w-7 h-7 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </span>
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
