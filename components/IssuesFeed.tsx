import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Stock, FeedItem } from '../types';
// 뉴스 피드 컴포넌트
interface IssuesFeedProps {
  stocks: Stock[];
  onStockClick: (stock: Stock) => void;
  isDarkMode: boolean;
  glossary: Record<string, string>;
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
        className={`font-black underline decoration-dashed decoration-2 underline-offset-4 transition-colors ${
          isDarkMode ? 'text-primary-accent decoration-blue-500/50' : 'text-primary decoration-primary/40'
        } hover:decoration-solid`}
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
            {/* Arrow */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-primary-dark border-primary'
            }`} />
          </div>
        </div>
      )}
    </span>
  );
};

// [CMS증권] 텍스트를 배지로 변환하고 전문 용어를 하이라이트하는 컴포넌트
const TextWithCMS: React.FC<{ text: string; isDarkMode: boolean; isTitle?: boolean; hideBadge?: boolean; glossary: Record<string, string> }> = ({ text, isDarkMode, isTitle, hideBadge, glossary }) => {
  // 전문 용어 처리 로직
  const highlightTerms = (inputText: string) => {
    const terms = Object.keys(glossary);
    if (terms.length === 0) return inputText;

    // 정규식 생성 (단어 경계 체크 포함)
    const regex = new RegExp(`(${terms.join('|')})`, 'g');
    const parts = inputText.split(regex);

    return parts.map((part, i) => {
      if (glossary[part]) {
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
            <span className={`inline-flex items-center justify-center bg-primary text-white font-black px-1.5 py-0.5 rounded text-[10px] leading-none mx-1 align-baseline shadow-sm tracking-tighter ${isTitle ? 'scale-110' : 'scale-100'}`}>
              CMS
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

const IssuesFeed: React.FC<IssuesFeedProps> = ({ stocks, onStockClick, isDarkMode, glossary }) => {
  const todayStr = useMemo(() => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  }, []);

  const feedItems = React.useMemo(() => {
    const items: FeedItem[] = [];
    stocks.forEach(stock => {
      if (stock.issues && stock.issues.length > 0) {
        stock.issues.forEach(issue => {
          const isCMS = issue.isCMS ?? issue.title?.includes('[CMS증권]') ?? false;
          items.push({
            stockId: stock.id,
            stockName: stock.nameKr,
            stockTicker: stock.ticker,
            type: isCMS ? 'COMMENT' : 'ISSUE',
            isCMS,
            title: issue.title,
            content: issue.content,
            keywords: issue.keywords || [],
            date: issue.date,
            images: issue.images
          });
        });
      }
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [stocks]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {feedItems.map((item, index) => {
        const stock = stocks.find(s => s.id === item.stockId);
        const isToday = item.date === todayStr;
        const isLastToday = isToday && (index === feedItems.length - 1 || feedItems[index + 1].date !== todayStr);
        const isFirstItem = index === 0;

        return (
          <React.Fragment key={`${item.stockId}-${item.type}-${index}`}>
            {isFirstItem && isToday && (
              <div className="flex items-center gap-6 mb-10 opacity-100">
                <div className="flex-1 h-[3px] bg-primary/10" />
                <span className="text-[12px] font-black text-primary tracking-[0.3em] uppercase px-4 py-1.5 rounded-full border-2 border-primary/20 bg-white">Latest Updates</span>
                <div className="flex-1 h-[3px] bg-primary/10" />
              </div>
            )}

            <div className={`relative pl-10 lg:pl-16 pb-16 group border-l-[3px] transition-all ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 ${item.isCMS ? 'bg-primary border-white dark:border-primary/40 shadow-xl' : 'bg-slate-500 border-white dark:border-[#0a192f] shadow-lg'}`} />

              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-lg lg:text-2xl font-black tracking-tighter ${
                    isToday ? 'text-primary underline decoration-primary/30' : (isDarkMode ? 'text-white' : 'text-gray-900')
                  }`}>
                    {item.date}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20`}>
                    News
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <button onClick={() => stock && onStockClick(stock)} className={`text-base lg:text-lg font-black transition-all hover:translate-x-1 ${isDarkMode ? 'text-white hover:text-primary-accent' : 'text-gray-900 hover:text-primary'}`}>
                    {item.stockName}
                    <span className="ml-1 text-sm font-black opacity-30">&rarr;</span>
                  </button>
                  <span className={`text-[12px] lg:text-[13px] font-mono font-black tracking-widest px-2 py-0.5 rounded border-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{item.stockTicker}</span>
                </div>
              </div>

              <div
                className={`rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 border-2 transition-all duration-500 transform hover:-translate-y-2 group ${
                  item.isCMS
                    ? (isDarkMode ? 'bg-slate-800 border-blue-500/40 border-l-8 border-l-primary shadow-2xl' : 'bg-white border-blue-200 shadow-lg border-l-8 border-l-primary')
                    : (isDarkMode ? 'bg-[#112240] border-slate-600 hover:border-blue-500 shadow-2xl' : 'bg-white border-gray-300 hover:border-primary shadow-lg')
                }`}
              >
                <div className="flex flex-wrap gap-2 lg:gap-3 mb-6">
                  {item.keywords?.map((kw, i) => (
                    <span key={i} className={`text-[10px] lg:text-sm font-black px-3 py-1 lg:px-4 lg:py-1.5 rounded-xl border-2 transition-all ${isDarkMode ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary'}`}>#{kw}</span>
                  ))}
                </div>
                {item.title && <h4 className={`text-lg lg:text-2xl font-black mb-5 tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <TextWithCMS text={item.title} isDarkMode={isDarkMode} isTitle={true} glossary={glossary} />
                </h4>}
                <div className={`text-[14px] lg:text-[17px] leading-relaxed whitespace-pre-wrap font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                  <TextWithCMS text={item.content} isDarkMode={isDarkMode} hideBadge={true} glossary={glossary} />
                </div>

                {/* 피드용 이미지 갤러리 */}
                {item.images && item.images.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.images.map((img, i) => (
                      <div key={i} className={`aspect-video rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button onClick={() => stock && onStockClick(stock)} className={`text-[11px] font-black flex items-center gap-2 transition-all transform group-hover:translate-x-0 translate-x-4 opacity-0 group-hover:opacity-100 ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>
                    AI 분석 및 상세 보기 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {isLastToday && (
              <div className="flex items-center gap-6 my-14 animate-in fade-in zoom-in duration-700">
                <div className="flex-1 h-[3px] bg-gradient-to-r from-transparent to-primary/40" />
                <div className="px-6 py-2 rounded-full border-2 border-primary/30 bg-blue-50 dark:bg-primary/10 flex items-center gap-3 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-black text-primary tracking-[0.2em] uppercase">Today's Session End</span>
                </div>
                <div className="flex-1 h-[3px] bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default IssuesFeed;
