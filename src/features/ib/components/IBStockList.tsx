import React, { useRef, useEffect, useCallback } from 'react';
import { IBOpinion } from '@/shared/types';
import { IBDateGroup } from '../hooks/useIBOpinions';

interface IBStockListProps {
  dateGroups: IBDateGroup[];
  onSelect: (opinion: IBOpinion) => void;
  isDarkMode: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  searchQuery?: string;
}

const IBStockList: React.FC<IBStockListProps> = ({ dateGroups, onSelect, isDarkMode, hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery = '' }) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="space-y-8">
      {dateGroups.length === 0 && searchQuery.trim() && (
        <div className={`text-center py-12 rounded-[20px] border ${isDarkMode ? 'bg-[#112240] border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-bold">'{searchQuery.trim()}'에 대한 검색 결과가 없습니다</p>
        </div>
      )}

      {dateGroups.map((group) => (
        <div key={group.date}>
          {/* Date Header */}
          <div className={`flex items-center gap-3 mb-3 px-2`}>
            <span className={`text-base font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{group.date}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>{group.opinions.length}건</span>
            <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`} />
          </div>

          {/* Table Header */}
          <div className={`hidden lg:flex px-6 py-2 items-center text-[11px] uppercase tracking-widest`}>
            <div className="w-[8%] text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>TICKER</span></div>
            <div className="flex-[2.5] text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>NAME</span></div>
            <div className="flex-[2] text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>SECTOR</span></div>
            <div className="flex-[1.8] text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>IB</span></div>
            <div className="flex-1 text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>OPINION</span></div>
            <div className="flex-1 text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>PREV PRICE</span></div>
            <div className="flex-1 text-center"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>TARGET</span></div>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-4 mt-1">
            {group.opinions.map((opinion) => (
              <div
                key={opinion.id}
                onClick={() => onSelect(opinion)}
                className={`group relative flex flex-col lg:flex-row lg:items-center px-6 py-4 lg:px-6 lg:py-3 rounded-[16px] transition-all duration-500 cursor-pointer transform hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-[#112240] border border-slate-600 hover:border-primary-light shadow-xl'
                    : 'bg-white border border-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:border-primary/40'
                }`}
              >
                {/* TICKER */}
                <div className="hidden lg:flex w-[8%] justify-center">
                  <span className={`text-[11px] font-mono font-black tracking-tight px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>{opinion.ticker}</span>
                </div>

                {/* NAME */}
                <div className="flex justify-between items-start lg:items-center lg:flex-[2.5] lg:justify-center">
                  <div className="flex flex-col lg:items-center">
                    <span className={`font-black text-lg lg:text-[15px] leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900 group-hover:text-primary'}`}>{opinion.stockName}</span>
                    <div className="lg:hidden flex gap-1 mt-0.5">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary/60'}`}>{opinion.ticker}</span>
                    </div>
                  </div>
                  {/* Mobile: show opinion */}
                  <div className="lg:hidden text-right">
                    <div className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{opinion.opinion || '-'}</div>
                    <div className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{opinion.ib}</div>
                  </div>
                </div>

                {/* SECTOR */}
                <div className="hidden lg:flex lg:flex-[2] justify-center">
                  <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border truncate max-w-[90%] text-center ${isDarkMode ? 'bg-slate-800 text-blue-200 border-slate-600' : 'bg-white text-gray-700 border-gray-200 shadow-sm'}`}>
                    {opinion.sector || '-'}
                  </span>
                </div>

                {/* IB */}
                <div className={`hidden lg:flex lg:flex-[1.8] justify-center text-center text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className="truncate">{opinion.ib}</span>
                </div>

                {/* OPINION */}
                <div className={`hidden lg:flex lg:flex-1 justify-center text-center text-[13px] font-black ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                  {opinion.opinion || '-'}
                </div>

                {/* PREV PRICE */}
                <div className={`hidden lg:flex lg:flex-1 justify-center text-center text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {opinion.prevPrice || '-'}
                </div>

                {/* TARGET PRICE */}
                <div className={`hidden lg:flex lg:flex-1 justify-center text-center text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {opinion.targetPrice || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading spinner */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* End of data */}
      {!hasNextPage && dateGroups.length > 0 && (
        <div className={`text-center py-6 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>
          End of data
        </div>
      )}
    </div>
  );
};

export default IBStockList;
