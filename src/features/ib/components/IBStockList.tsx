import React from 'react';
import { IBStockGroup } from '../hooks/useIBOpinions';

interface IBStockListProps {
  groups: IBStockGroup[];
  onSelect: (group: IBStockGroup) => void;
  isDarkMode: boolean;
}

const IBStockList: React.FC<IBStockListProps> = ({ groups, onSelect, isDarkMode }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`hidden lg:flex px-6 py-2 items-center text-[11px] uppercase tracking-widest`}>
        <div className="w-[8%] shrink-0"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>TICKER</span></div>
        <div className="w-[16%] shrink-0 pl-6"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>NAME</span></div>
        <div className="w-[12%] shrink-0 pl-4"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>SECTOR</span></div>
        <div className="w-[10%] shrink-0 pl-4"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>IB</span></div>
        <div className="w-[14%] shrink-0 pl-4"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>OPINION</span></div>
        <div className="w-[12%] shrink-0 text-right"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>PREV PRICE</span></div>
        <div className="w-[12%] shrink-0 text-right pr-2"><span className={`font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>TARGET</span></div>
      </div>

      <div className="flex flex-col gap-4 mt-1">
        {groups.map((group) => {
          const latest = group.latestOpinions[0];
          return (
            <div
              key={group.ticker}
              onClick={() => onSelect(group)}
              className={`group relative flex flex-col lg:flex-row lg:items-center px-6 py-4 lg:px-6 lg:py-3 rounded-[16px] transition-all duration-500 cursor-pointer transform hover:-translate-y-1 ${
                isDarkMode
                  ? 'bg-[#112240] border border-slate-600 hover:border-primary-light shadow-xl'
                  : 'bg-white border border-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:border-primary/40'
              }`}
            >
              {/* TICKER */}
              <div className="hidden lg:flex lg:w-[8%] lg:shrink-0 items-center">
                <span className={`text-[11px] font-mono font-black tracking-tight px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>{group.ticker}</span>
              </div>

              {/* NAME */}
              <div className="flex justify-between items-start lg:items-center lg:w-[16%] lg:shrink-0 lg:pl-6">
                <div className="flex flex-col">
                  <span className={`font-black text-lg lg:text-[16px] leading-tight mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900 group-hover:text-primary'}`}>{group.stockName}</span>
                  <div className="lg:hidden flex gap-1 mt-0.5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary/60'}`}>{group.ticker}</span>
                  </div>
                </div>
                {/* Mobile: show opinion */}
                <div className="lg:hidden text-right">
                  <div className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{latest.opinion || '-'}</div>
                  <div className={`text-xs font-bold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{latest.ib}</div>
                </div>
              </div>

              {/* SECTOR */}
              <div className="hidden lg:flex lg:w-[12%] lg:shrink-0 pl-4">
                <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border ${isDarkMode ? 'bg-slate-800 text-blue-200 border-slate-600' : 'bg-white text-gray-700 border-gray-200 shadow-sm'}`}>
                  {group.sector || '-'}
                </span>
              </div>

              {/* IB */}
              <div className={`hidden lg:flex lg:w-[10%] lg:shrink-0 pl-4 text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {latest.ib}
                {group.latestOpinions.length > 1 && (
                  <span className={`ml-1 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>+{group.latestOpinions.length - 1}</span>
                )}
              </div>

              {/* OPINION */}
              <div className={`hidden lg:flex lg:w-[14%] lg:shrink-0 pl-4 text-[13px] font-black ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                {latest.opinion || '-'}
              </div>

              {/* PREV PRICE */}
              <div className={`hidden lg:flex lg:w-[12%] lg:shrink-0 justify-end text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {latest.prevPrice || '-'}
              </div>

              {/* TARGET PRICE */}
              <div className={`hidden lg:flex lg:w-[12%] lg:shrink-0 justify-end pr-2 text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {latest.targetPrice || '-'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IBStockList;
