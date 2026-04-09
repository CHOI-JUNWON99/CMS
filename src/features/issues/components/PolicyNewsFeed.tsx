import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PolicyNews } from '@/shared/types';
import { SearchInput } from '@/shared/components/ui';
import { TextWithCMS } from '@/shared/components/TextWithCMS';

interface PolicyNewsFeedProps {
  items: PolicyNews[];
  isDarkMode: boolean;
  glossary: Record<string, string>;
}

const PolicyNewsFeed: React.FC<PolicyNewsFeedProps> = ({ items, isDarkMode, glossary }) => {
  const todayStr = useMemo(() => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  }, []);

  const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}. ${hh}:${min}`;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const keywords = (item.keywords || []).join(' ').toLowerCase();
      return title.includes(query) || keywords.includes(query);
    });
  }, [items, searchQuery]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="제목, 키워드로 검색..."
          isDarkMode={isDarkMode}
          className="w-full"
        />
      </div>

      {filteredItems.length === 0 && searchQuery.trim() && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-bold">'{searchQuery.trim()}'에 대한 검색 결과가 없습니다</p>
        </div>
      )}

      {filteredItems.length === 0 && !searchQuery.trim() && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
          <p className="text-sm font-bold">등록된 정책 뉴스가 없습니다</p>
        </div>
      )}

      {filteredItems.map((item, index) => {
        const isToday = item.date === todayStr;
        const isLastToday = isToday && (index === filteredItems.length - 1 || filteredItems[index + 1].date !== todayStr);

        return (
          <React.Fragment key={`policy-${item.id}-${index}`}>
            <div className={`relative pl-0 min-[425px]:pl-10 lg:pl-16 pb-5 min-[425px]:pb-8 group border-l-0 min-[425px]:border-l-[3px] transition-all ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className={`hidden min-[425px]:block absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 ${item.isCMS ? 'bg-primary border-white dark:border-primary/40 shadow-xl' : 'bg-slate-500 border-white dark:border-[#0a192f] shadow-lg'}`} />

              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-base lg:text-xl font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                    {item.date}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl p-5 lg:p-7 border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group ${
                  item.isCMS
                    ? (isDarkMode ? 'bg-[#112240] border-slate-700 border-l-4 border-l-primary shadow-lg' : 'bg-white border-gray-200 border-l-4 border-l-primary shadow-md')
                    : (isDarkMode ? 'bg-[#112240] border-slate-700 shadow-lg' : 'bg-white border-gray-200 shadow-md')
                }`}
              >
                {item.title && <h4 className={`text-xl lg:text-2xl font-black mb-3 tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <TextWithCMS text={item.title} isDarkMode={isDarkMode} isTitle={true} glossary={glossary} />
                </h4>}

                {item.keywords && item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.keywords.map((kw, i) => (
                      <span key={i} className={`text-[12px] lg:text-[13px] font-bold px-3 py-1 rounded-full border transition-all ${isDarkMode ? 'bg-transparent text-slate-300 border-slate-600' : 'bg-white text-gray-600 border-gray-300'}`}>#{kw}</span>
                    ))}
                  </div>
                )}

                <div className={`text-[11px] lg:text-[13px] mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <span className="ml-0.5 font-medium">업데이트</span>
                  <span className="ml-2 font-medium">
                    {formatDateTime(item.updatedAt) || formatDateTime(item.createdAt) || item.date}
                  </span>
                </div>

                <div className={`border-t mb-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} />

                <div className={`text-[14px] lg:text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                  <TextWithCMS text={item.content} isDarkMode={isDarkMode} hideBadge={true} glossary={glossary} />
                </div>

                {item.images && item.images.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.images.map((img, i) => (
                      <div key={i} className={`aspect-video rounded-xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isLastToday && (
              <div className="flex items-center gap-6 my-14 animate-in fade-in zoom-in duration-700">
                <div className="flex-1 h-[3px] bg-gradient-to-r from-transparent to-primary/40" />
                <div className="px-6 py-2 rounded-full border-2 border-primary/30 bg-blue-50 dark:bg-primary/10 flex items-center gap-3 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-black text-primary tracking-[0.2em] uppercase">Today</span>
                </div>
                <div className="flex-1 h-[3px] bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            )}
          </React.Fragment>
        );
      })}

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
            : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
        }`}
        aria-label="맨 위로 이동"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default PolicyNewsFeed;
