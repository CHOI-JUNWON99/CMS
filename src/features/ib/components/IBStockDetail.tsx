import React, { useState, useMemo } from 'react';
import { IBOpinion } from '@/shared/types';
import { useIBTickerOpinions } from '../hooks/useIBOpinions';

interface IBStockDetailProps {
  ticker: string;
  stockName: string;
  sector: string;
  onBack: () => void;
  isDarkMode: boolean;
}

const IBStockDetail: React.FC<IBStockDetailProps> = ({ ticker, stockName, sector, onBack, isDarkMode }) => {
  const { data: allOpinions = [], isLoading } = useIBTickerOpinions(ticker);
  const [selectedComment, setSelectedComment] = useState<IBOpinion | null>(null);

  const latest = allOpinions[0] || null;

  const timelineData = useMemo(() => {
    return [...allOpinions].sort((a, b) => b.date.localeCompare(a.date));
  }, [allOpinions]);

  const formatPercent = (val: number | null) => {
    if (val === null) return '-';
    return `${(val * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-20 relative px-4 lg:px-0">
      {/* Sticky Back Button */}
      <div className="sticky top-16 z-40 py-4 mb-6 pointer-events-none">
        <button onClick={onBack} className={`pointer-events-auto inline-flex items-center transition-all group py-2.5 px-6 rounded-2xl backdrop-blur-xl border shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-600' : 'bg-white/80 hover:bg-gray-50 border-gray-300'}`}>
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          <span className={`text-[15px] font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>목록으로</span>
        </button>
      </div>

      {/* Top Section: Basic Info & Stats */}
      <div className={`mb-10 pb-10 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left: Basic Info */}
          <div className="space-y-4 min-w-0 lg:flex-1">
            <div className="flex items-center gap-2">
              <div className={`text-[14px] font-mono font-black tracking-wider px-3 py-1.5 rounded-xl border inline-block uppercase ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{ticker}</div>
            </div>
            <div>
              <h1 className={`text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stockName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {sector && (
                <span className="text-sm font-black px-4 py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/10">{sector}</span>
              )}
            </div>
          </div>

          {/* Right: Stats Box */}
          {latest && (
            <div className="flex flex-col w-full lg:w-auto lg:min-w-[340px] lg:shrink-0">
              <div className={`w-full flex flex-col gap-3 xs:gap-4 sm:gap-6 px-4 xs:px-6 sm:px-10 py-4 xs:py-6 sm:py-8 rounded-2xl sm:rounded-[2rem] border shadow-xl ${isDarkMode ? 'bg-[#112240] border-slate-700 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/40'}`}>
                {/* Row 1: Opinion & Current Price */}
                <div className={`grid grid-cols-2 gap-x-4 xs:gap-x-6 sm:gap-x-8 border-b pb-3 xs:pb-4 sm:pb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <div className={`flex flex-col pr-4 xs:pr-6 sm:pr-8 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <span className={`text-[8px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>OPINION</span>
                    <span className={`text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black leading-none ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      {latest.opinion || '-'}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2 xs:pl-4 sm:pl-4">
                    <span className={`text-[8px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>CURRENT PRICE</span>
                    <span className={`text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black leading-none ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      {latest.currentPrice || '-'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Prev Price / Target Price / Target Change */}
                <div className={`grid grid-cols-3 border-b pb-3 xs:pb-4 sm:pb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <div className={`flex flex-col items-center gap-1 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <span className={`text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PREV PRICE</span>
                    <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{latest.prevPrice || '-'}</span>
                  </div>
                  <div className={`flex flex-col items-center gap-1 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <span className={`text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>TARGET</span>
                    <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{latest.targetPrice || '-'}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>TGT CHG</span>
                    <span className={`text-sm xs:text-base sm:text-lg font-black ${
                      latest.targetChange !== null && latest.targetChange > 0
                        ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                        : latest.targetChange !== null && latest.targetChange < 0
                        ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                        : (isDarkMode ? 'text-white' : 'text-gray-900')
                    }`}>
                      {formatPercent(latest.targetChange)}
                    </span>
                  </div>
                </div>

                {/* Row 3: Upside / EPS */}
                <div className="grid grid-cols-2">
                  <div className={`flex items-center justify-center gap-1.5 xs:gap-2 py-1 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <span className={`text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>UPSIDE</span>
                    <span className={`text-sm xs:text-base sm:text-lg font-black ${
                      latest.upside !== null && latest.upside > 0
                        ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                        : latest.upside !== null && latest.upside < 0
                        ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                        : (isDarkMode ? 'text-white' : 'text-gray-900')
                    }`}>
                      {formatPercent(latest.upside)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 xs:gap-2 py-1">
                    <span className={`text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>EPS(FWD)</span>
                    <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {latest.eps !== null ? latest.eps.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Timeline */}
      <div className="mt-12 xs:mt-20">
        <div className="flex items-center gap-2 xs:gap-4 mb-6 xs:mb-10">
          <h3 className={`text-lg xs:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>IB 코멘트 타임라인</h3>
          <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
          <span className="text-[10px] xs:text-xs font-bold text-gray-400 uppercase tracking-widest">{timelineData.length} COMMENTS</span>
        </div>

        {timelineData.length > 0 ? (
          <div className="relative max-w-5xl mx-auto pl-0 min-[425px]:pl-8 xs:pl-12">
            {/* Continuous vertical line */}
            <div className={`hidden min-[425px]:block absolute left-0 top-0 bottom-0 w-[2px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />

            <div className="space-y-3 xs:space-y-5">
              {timelineData.map((item, idx) => (
                <div key={idx} className="group relative transition-all">
                  <div className={`hidden min-[425px]:block absolute -left-8 xs:-left-12 top-1 ml-[-7px] xs:ml-[-9px] w-4 h-4 xs:w-5 xs:h-5 rounded-full border-[3px] xs:border-4 transition-all group-hover:scale-125 z-10 bg-primary border-white shadow-md`} />

                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 xs:gap-4 mb-3 xs:mb-4">
                    <span className={`text-base xs:text-xl font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{item.date}</span>
                    <div className="flex flex-wrap gap-1.5 xs:gap-2">
                      <span className={`text-[9px] xs:text-[11px] font-bold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-300'}`}>IB : {item.ib}</span>
                      {item.analyst && (
                        <span className={`text-[9px] xs:text-[11px] font-bold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-300'}`}>Analyst : {item.analyst}</span>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedComment(item)}
                    className={`p-4 xs:p-8 lg:p-10 rounded-xl xs:rounded-[1rem] border transition-all cursor-pointer hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 border-l-[6px] xs:border-l-[10px] border-l-primary ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-300 shadow-sm'}`}
                  >
                    {/* IB Data Summary */}
                    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 xs:mb-6 pb-4 xs:pb-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>투자의견</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.opinion || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>기존주가</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.prevPrice || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>목표주가</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.targetPrice || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>목표가변화</span>
                        <span className={`text-sm xs:text-base font-black ${
                          item.targetChange !== null && item.targetChange > 0
                            ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                            : item.targetChange !== null && item.targetChange < 0
                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                            : (isDarkMode ? 'text-white' : 'text-gray-900')
                        }`}>{formatPercent(item.targetChange)}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>현재주가</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.currentPrice || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>업사이드</span>
                        <span className={`text-sm xs:text-base font-black ${
                          item.upside !== null && item.upside > 0
                            ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                            : item.upside !== null && item.upside < 0
                            ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                            : (isDarkMode ? 'text-white' : 'text-gray-900')
                        }`}>{formatPercent(item.upside)}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>EPS(FWD)</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.eps !== null ? item.eps.toFixed(2) : '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] xs:text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>IB</span>
                        <span className={`text-sm xs:text-base font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.ib}</span>
                      </div>
                    </div>

                    {/* Comment */}
                    {item.comment && (
                      <div className={`text-[13px] xs:text-[16px] lg:text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        {item.comment}
                      </div>
                    )}

                    {/* Analyst */}
                    {item.analyst && (
                      <div className={`mt-4 text-right text-[11px] xs:text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        — {item.analyst}
                      </div>
                    )}

                    <div className="mt-4 xs:mt-8 flex justify-end">
                      <span className={`text-[10px] xs:text-xs font-black flex items-center gap-1 xs:gap-1.5 transition-all hover:gap-2 ${isDarkMode ? 'text-slate-300 hover:text-slate-100' : 'text-accent hover:text-accent-dark'}`}>
                        상세 보기 <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`py-16 xs:py-32 text-center rounded-2xl xs:rounded-[3rem] border-2 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <p className="text-gray-300 text-xs xs:text-base font-black uppercase tracking-[0.2em] xs:tracking-[0.3em]">No Comments Available</p>
          </div>
        )}
      </div>

      {/* Comment Detail Modal */}
      {selectedComment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 xs:p-6 lg:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-primary-dark/40 backdrop-blur-md" onClick={() => setSelectedComment(null)} />
          <div className={`relative w-full max-w-4xl rounded-2xl xs:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#0a192f] border border-slate-700' : 'bg-white'}`}>
            <div className="p-4 xs:p-10 lg:p-14 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-5 xs:mb-10">
                <span className="text-base xs:text-2xl font-black text-primary">{selectedComment.date} — {selectedComment.ib}</span>
                <button onClick={() => setSelectedComment(null)} className={`p-1.5 xs:p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                  <svg className="w-6 h-6 xs:w-8 xs:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Data grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 xs:p-6 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                {[
                  { label: '투자의견', value: selectedComment.opinion || '-' },
                  { label: '기존주가', value: selectedComment.prevPrice || '-' },
                  { label: '목표주가', value: selectedComment.targetPrice || '-' },
                  { label: '목표가변화', value: formatPercent(selectedComment.targetChange) },
                  { label: '현재주가', value: selectedComment.currentPrice || '-' },
                  { label: '업사이드', value: formatPercent(selectedComment.upside) },
                  { label: 'EPS(FWD)', value: selectedComment.eps !== null ? selectedComment.eps.toFixed(2) : '-' },
                  { label: '애널리스트', value: selectedComment.analyst || '-' },
                ].map((item, i) => (
                  <div key={i}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{item.label}</span>
                    <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div className={`p-4 xs:p-8 rounded-xl xs:rounded-[2rem] text-[13px] xs:text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-50 text-gray-700'}`}>
                {selectedComment.comment || '코멘트 없음'}
              </div>
            </div>
            <div className={`p-4 xs:p-8 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              <button onClick={() => setSelectedComment(null)} className="px-8 xs:px-12 py-3 xs:py-4 rounded-xl xs:rounded-2xl bg-primary text-white font-black text-sm xs:text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IBStockDetail;
