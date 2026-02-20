import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stock, IssueImage } from '@/shared/types';
import { parseMarketCap } from '@/shared/utils';

interface StockDetailProps {
  stock: Stock;
  onBack: () => void;
  isDarkMode: boolean;
  glossary: Record<string, string>;
}

interface UnifiedInsight {
  date: string;
  type: 'ISSUE' | 'COMMENT';
  isCMS: boolean;
  title: string;
  content: string;
  keywords: string[];
  images?: IssueImage[];
}

interface AiBriefing {
  summary: string;
  keywords: string[];
}

// 용어 툴팁 컴포넌트
const TermWithTooltip: React.FC<{ term: string; definition: string; isDarkMode: boolean }> = ({ term, definition, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-block" ref={tooltipRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`font-black underline decoration-solid decoration-1 underline-offset-4 transition-colors ${
          isDarkMode ? 'text-primary-accent decoration-blue-400/60' : 'text-primary decoration-primary/50'
        }`}
      >
        {term}
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[60] w-64 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          <div className={`p-4 rounded-xl shadow-2xl border text-[13px] leading-relaxed font-bold ${
            isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-primary-dark border-primary text-white'
          }`}>
            <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">용어 풀이</div>
            {definition}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-primary-dark border-primary'
            }`} />
          </div>
        </div>
      )}
    </span>
  );
};

const TextWithCMS: React.FC<{ text: string; isDarkMode: boolean; isTitle?: boolean; hideBadge?: boolean; glossary?: Record<string, string> }> = ({ text, isDarkMode, isTitle, hideBadge, glossary }) => {
  // 전문 용어 처리 로직
  const highlightTerms = (inputText: string) => {
    const terms = Object.keys(glossary || {});
    if (terms.length === 0) return inputText;

    const regex = new RegExp(`(${terms.join('|')})`, 'g');
    const parts = inputText.split(regex);

    return parts.map((part, i) => {
      if (glossary && glossary[part]) {
        return <TermWithTooltip key={i} term={part} definition={glossary[part]} isDarkMode={isDarkMode} />;
      }
      return part;
    });
  };

  if (!text.includes('[CMS증권]')) {
    return <>{highlightTerms(text)}</>;
  }

  const cmsParts = text.split('[CMS증권]');
  return (
    <>
      {cmsParts.map((part, i) => (
        <React.Fragment key={i}>
          {highlightTerms(part)}
          {i < cmsParts.length - 1 && !hideBadge && (
            <span className={`inline-flex items-center justify-center bg-primary text-white font-black px-1.5 py-0.5 rounded text-[10px] shadow-sm tracking-tighter ${isTitle ? 'scale-110' : 'scale-100'}`} style={{ verticalAlign: 'middle', marginTop: '-2px' }}>
              CMS
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// 기본 아이콘 (이미지가 없을 때 사용)
const DefaultSegmentIcon: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <svg className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
  </svg>
);

const StockDetail: React.FC<StockDetailProps> = ({ stock, onBack, isDarkMode, glossary }) => {
  const [aiBriefing, setAiBriefing] = useState<AiBriefing | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<UnifiedInsight | null>(null);

  const timelineData = useMemo(() => {
    return stock.issues.map(issue => ({
      date: issue.date,
      type: issue.title?.includes('[CMS증권]') ? 'COMMENT' as const : 'ISSUE' as const,
      isCMS: !!issue.isCMS,
      title: issue.title || '',
      content: issue.content,
      keywords: issue.keywords || [],
      images: issue.images
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [stock]);

  useEffect(() => {
    // DB에 저장된 AI 요약만 표시 (관리자 페이지에서 생성)
    if (stock.aiSummary && stock.aiSummary.trim()) {
      setAiBriefing({
        summary: stock.aiSummary,
        keywords: stock.aiSummaryKeywords || [],
      });
    } else {
      setAiBriefing(null);
    }
  }, [stock]);

  const handleInsightClick = (insight: UnifiedInsight) => {
    setSelectedInsight(insight);
  };

  const renderMarketCap = (capStr: string) => {
    const parsed = parseMarketCap(capStr);
    if (!parsed) {
      // 파싱 실패 시 원본 텍스트를 YTD와 동일한 스타일로 표시
      return (
        <span className={`text-base xs:text-lg sm:text-2xl lg:text-2xl font-black leading-none ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
          {capStr}
        </span>
      );
    }
    return (
      <span className={`flex flex-col items-start xs:flex-row xs:items-baseline ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
        {/* 조 그룹 */}
        <span className="whitespace-nowrap">
          <span className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{parsed.jo}</span>
          <span className="text-sm xs:text-base sm:text-lg lg:text-xl font-black mx-0.5">조</span>
        </span>
        {/* 억원 그룹 */}
        <span className="whitespace-nowrap xs:ml-1">
          <span className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{parsed.ok}</span>
          <span className="text-sm xs:text-base sm:text-lg lg:text-xl font-black ml-0.5">억원</span>
        </span>
      </span>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-20 relative px-4 lg:px-0">
      {/* Sticky Back Button */}
      <div className="sticky top-16 z-40 py-4 mb-6 pointer-events-none">
        <button onClick={onBack} className={`pointer-events-auto inline-flex items-center transition-all group py-2.5 px-6 rounded-2xl backdrop-blur-xl border shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-600' : 'bg-white/80 hover:bg-gray-50 border-gray-300'}`}>
          <svg className={`w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          <span className={`text-[15px] font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>목록으로</span>
        </button>
      </div>

      {/* Top Section: Corporate Title & Basic Stats */}
      <div className={`mb-10 pb-10 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {(stock.tickers && stock.tickers.length > 1 ? stock.tickers : [stock.ticker]).map((ticker, idx) => (
                <div key={idx} className={`text-[14px] font-mono font-black tracking-wider px-3 py-1.5 rounded-xl border inline-block uppercase ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>{ticker}</div>
              ))}
            </div>
            <div>
              <h1 className={`text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-1 whitespace-pre-line ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.nameKr}</h1>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{stock.name}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-sm font-black px-4 py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/10`}>{stock.sector}</span>
              {stock.keywords.map((kw, i) => <span key={i} className={`text-sm font-black px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-50 text-gray-600 border-gray-300'}`}>#{kw}</span>)}
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-auto">
            <div className={`w-full flex flex-col gap-3 xs:gap-4 sm:gap-6 px-4 xs:px-6 sm:px-10 py-4 xs:py-6 sm:py-8 rounded-2xl sm:rounded-[2rem] border shadow-xl ${isDarkMode ? 'bg-[#112240] border-slate-700 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/40'}`}>
              <div className={`grid grid-cols-2 gap-x-4 xs:gap-x-6 sm:gap-x-8 border-b pb-3 xs:pb-4 sm:pb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <div className={`flex flex-col pr-4 xs:pr-6 sm:pr-8 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <span className={`text-[8px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>MARKET CAP</span>
                  <div className="flex items-baseline">{renderMarketCap(stock.marketCap)}</div>
                </div>
                <div className="flex flex-col pl-2 xs:pl-4 sm:pl-4">
                  <span className={`text-[8px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>YTD</span>
                  <div className="flex-1 flex items-center">
                    <span className={`text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black leading-none ${
                      (stock.returnRate || 0) >= 0
                        ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                        : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                    }`}>
                      {(stock.returnRate || 0) > 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3">
                <div className={`flex items-center justify-center gap-1.5 xs:gap-2 py-1 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <span className={`text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PER</span>
                  <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stock.per ? stock.per.toFixed(1) : '-'}
                  </span>
                </div>
                <div className={`flex items-center justify-center gap-1.5 xs:gap-2 py-1 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <span className={`text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PBR</span>
                  <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stock.pbr ? stock.pbr.toFixed(1) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 xs:gap-2 py-1">
                  <span className={`text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PSR</span>
                  <span className={`text-sm xs:text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stock.psr ? stock.psr.toFixed(1) : '-'}
                  </span>
                </div>
              </div>
            </div>
            {/* 최종 업데이트 날짜 - 박스 밖 오른쪽 하단 */}
            {(stock.lastUpdate || stock.createdAt) && (
              <div className="flex justify-end mt-1.5 xs:mt-2 pr-1">
                <span className={`text-[8px] xs:text-[9px] sm:text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  업데이트: {(stock.lastUpdate || stock.createdAt)?.slice(0, 10).replace(/-/g, '.')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="mb-16">
        <div className="flex justify-center mb-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full max-w-5xl py-3 px-8 rounded-full border-2 transition-all duration-300 flex items-center justify-between group hover:shadow-xl active:scale-[0.99] ${
              isExpanded
                ? (isDarkMode ? 'bg-primary/20 border-blue-500 text-primary-accent' : 'bg-blue-50 border-primary text-primary')
                : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary')
            }`}
          >
            <div className="flex-1 h-[1px] bg-current opacity-10" />
            <span className="mx-6 text-[15px] font-black tracking-widest uppercase">회사 개요</span>
            <div className="flex-1 h-[1px] bg-current opacity-10" />
            <svg className={`w-5 h-5 ml-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
            {/* Description Card */}
            <div className={`rounded-2xl xs:rounded-[3rem] p-6 xs:p-10 lg:p-14 border shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-[#112240] border-slate-600 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/30'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 xs:gap-3 mb-5 xs:mb-8">
                  <span className="bg-primary text-white text-[9px] xs:text-[10px] font-black uppercase tracking-[0.15em] xs:tracking-[0.2em] px-2 xs:px-3 py-1 rounded-full">Company Insight</span>
                  <div className="h-[1px] flex-1 bg-primary/10" />
                </div>
                <div className="flex flex-col gap-4 xs:gap-6">
                  <h3 className={`text-lg xs:text-xl lg:text-2xl font-black tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                    핵심 비즈니스 개요
                  </h3>
                  <div className={`text-[13px] xs:text-[15px] lg:text-[17px] leading-relaxed font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    " {stock.description} "
                  </div>
                </div>

                {/* 사업별 매출 비중 */}
                {stock.businessSegments && stock.businessSegments.length > 0 && (
                  <>
                    <div className={`mt-10 mb-8 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h4 className={`text-lg lg:text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                        사업별 매출 비중 <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(Revenue Mix)</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 xs:gap-3">
                      {[...stock.businessSegments].sort((a, b) => b.value - a.value).map((seg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl xs:rounded-2xl border p-3 xs:p-5 transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-4">
                            <div className="flex gap-1 shrink-0">
                              {seg.iconUrls && seg.iconUrls.length > 0 ? (
                                seg.iconUrls.map((url, i) => (
                                  <div key={i} className={`w-8 h-8 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl border flex items-center justify-center overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-300 bg-white'}`}>
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))
                              ) : (
                                <div className={`w-8 h-8 xs:w-10 xs:h-10 rounded-lg xs:rounded-xl border flex items-center justify-center ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-300 bg-white'}`}>
                                  <DefaultSegmentIcon isDark={isDarkMode} />
                                </div>
                              )}
                            </div>
                            <span className={`ml-auto text-xl xs:text-2xl font-black tracking-tight ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>
                              {seg.value}<span className={`text-sm xs:text-base font-bold ml-0.5 ${isDarkMode ? 'text-primary-accent/60' : 'text-primary/50'}`}>%</span>
                            </span>
                          </div>
                          <div className={`text-[11px] xs:text-[15px] font-black leading-snug ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {seg.nameKr}
                          </div>
                          <div className={`text-[7px] xs:text-[13px] font-bold uppercase tracking-wider mt-0.5 xs:mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                            {seg.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-8">
              {/* AI Briefing */}
              <div className={`rounded-2xl xs:rounded-[2.5rem] p-5 xs:p-10 lg:p-12 border shadow-xl flex flex-col ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-200 shadow-gray-200/30'}`}>
                <div className="flex items-center gap-2 xs:gap-3 mb-5 xs:mb-8">
                  <div className="bg-primary p-1.5 xs:p-2 rounded-lg text-white shadow-lg">
                     <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" /></svg>
                  </div>
                  <h3 className="text-[15px] xs:text-[18px] font-black tracking-tight text-primary">AI 기업 활동 요약</h3>
                </div>

                {aiBriefing ? (
                  <div className="space-y-4 xs:space-y-8 flex-1">
                    <div className="flex flex-wrap gap-1.5 xs:gap-2">
                      {aiBriefing.keywords.map((kw, i) => (
                        <span key={i} className={`text-[10px] xs:text-[12px] font-bold px-2 xs:px-3 py-1 xs:py-1.5 rounded-full border ${isDarkMode ? 'border-blue-800 text-primary-accent bg-primary/20' : 'border-blue-200 text-primary bg-blue-50/50'}`}>
                          #{kw.replace('#', '')}
                        </span>
                      ))}
                    </div>
                    <div className={`relative p-4 xs:p-8 rounded-xl xs:rounded-[2rem] border shadow-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50/30 border-gray-100'}`}>
                      <p className={`text-[12px] xs:text-[14px] lg:text-[15px] font-bold tracking-tight leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                        " {aiBriefing.summary} "
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 xs:py-20 text-gray-300 text-xs xs:text-base font-black uppercase tracking-widest">No Analysis Available</div>
                )}
              </div>

              {/* Investment Points */}
              <div className={`rounded-2xl xs:rounded-[2.5rem] p-5 xs:p-10 lg:p-12 bg-primary text-white shadow-2xl shadow-primary/30 flex flex-col border border-primary-dark`}>
                <div className="flex items-center gap-2 xs:gap-3 mb-6 xs:mb-10">
                  <div className="w-1 xs:w-1.5 h-5 xs:h-6 bg-white/40 rounded-full" />
                  <h3 className="text-[16px] xs:text-[20px] font-black tracking-tight">핵심 투자 가이드</h3>
                </div>
                <div className="space-y-6 xs:space-y-10 flex-1 flex flex-col justify-center">
                  {stock.investmentPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 xs:gap-5 group">
                      <div className="mt-0.5 xs:mt-1 flex-shrink-0 w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <svg className="w-3.5 h-3.5 xs:w-5 xs:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] xs:text-[17px] lg:text-[19px] font-black tracking-tight leading-tight">{point.title}</span>
                        <p className="text-[11px] xs:text-[13px] font-bold text-white/70 mt-1 leading-snug max-w-[90%]">
                          {point.description}
                        </p>
                        <div className="h-[1px] w-6 xs:w-8 mt-3 xs:mt-4 bg-white/10 rounded-full group-last:hidden" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={() => setIsExpanded(false)}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-black transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-primary'}`}
              >
                상세 정보 접기
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="mt-12 xs:mt-20">
        <div className="flex items-center gap-2 xs:gap-4 mb-6 xs:mb-10">
           <h3 className={`text-lg xs:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>최신 뉴스 및 타임라인</h3>
           <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
           <span className="text-[10px] xs:text-xs font-bold text-gray-400 uppercase tracking-widest">{timelineData.length} UPDATES</span>
        </div>

        {timelineData.length > 0 ? (
          <div className="relative max-w-5xl mx-auto pl-0 min-[425px]:pl-8 xs:pl-12">
            {/* Continuous vertical line */}
            <div className={`hidden min-[425px]:block absolute left-0 top-0 bottom-0 w-[2px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />

            <div className="space-y-3 xs:space-y-5">
            {timelineData.map((item, idx) => (
              <div
                key={idx}
                className={`group relative transition-all`}
              >
                <div className={`hidden min-[425px]:block absolute -left-8 xs:-left-12 top-1 ml-[-7px] xs:ml-[-9px] w-4 h-4 xs:w-5 xs:h-5 rounded-full border-[3px] xs:border-4 transition-all group-hover:scale-125 z-10 ${item.isCMS ? 'bg-primary border-white shadow-md' : 'bg-gray-400 border-white'}`} />

                <div className="flex flex-col lg:flex-row lg:items-center gap-2 xs:gap-4 mb-3 xs:mb-4">
                   <span className={`text-base xs:text-xl font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{item.date}</span>
                   <div className="flex flex-wrap gap-1.5 xs:gap-2">
                     {item.keywords.map((kw, i) => (
                       <span key={i} className={`text-[9px] xs:text-[11px] font-bold px-2 xs:px-3 py-0.5 xs:py-1 rounded-full border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-300'}`}>#{kw}</span>
                     ))}
                   </div>
                </div>

                <div
                  onClick={() => handleInsightClick(item)}
                  className={`p-4 xs:p-8 lg:p-10 rounded-xl xs:rounded-[1rem] border transition-all cursor-pointer hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-300 shadow-sm'} ${item.isCMS ? 'border-l-[6px] xs:border-l-[10px] border-l-primary' : ''}`}
                >
                  <h4 className={`text-base xs:text-xl lg:text-2xl font-black mb-3 xs:mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <TextWithCMS text={item.title} isDarkMode={isDarkMode} isTitle={true} glossary={glossary} />
                  </h4>
                  <div className={`text-[13px] xs:text-[16px] lg:text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                     <TextWithCMS text={item.content} isDarkMode={isDarkMode} hideBadge={true} glossary={glossary} />
                  </div>

                  {item.images && item.images.length > 0 && (
                    <div className="mt-4 xs:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-4">
                      {item.images.map((img, i) => (
                        <div key={i} className={`aspect-video rounded-xl xs:rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
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
             <p className="text-gray-300 text-xs xs:text-base font-black uppercase tracking-[0.2em] xs:tracking-[0.3em]">No Timeline Available for this asset</p>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 xs:p-6 lg:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-primary-dark/40 backdrop-blur-md" onClick={() => setSelectedInsight(null)} />
          <div className={`relative w-full max-w-4xl rounded-2xl xs:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#0a192f] border border-slate-700' : 'bg-white'}`}>
            <div className="p-4 xs:p-10 lg:p-14 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-5 xs:mb-10">
                <span className="text-base xs:text-2xl font-black text-primary">{selectedInsight.date} INSIGHT</span>
                <button onClick={() => setSelectedInsight(null)} className={`p-1.5 xs:p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                   <svg className="w-6 h-6 xs:w-8 xs:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div>
                <h2 className={`text-xl xs:text-3xl font-black mb-4 xs:mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><TextWithCMS text={selectedInsight.title} isDarkMode={isDarkMode} glossary={glossary} /></h2>
                <div className={`p-4 xs:p-8 rounded-xl xs:rounded-[2rem] text-[13px] xs:text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-50 text-gray-700'}`}><TextWithCMS text={selectedInsight.content} isDarkMode={isDarkMode} hideBadge={true} glossary={glossary} /></div>
              </div>
            </div>
            <div className={`p-4 xs:p-8 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
               <button onClick={() => setSelectedInsight(null)} className="px-8 xs:px-12 py-3 xs:py-4 rounded-xl xs:rounded-2xl bg-primary text-white font-black text-sm xs:text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
