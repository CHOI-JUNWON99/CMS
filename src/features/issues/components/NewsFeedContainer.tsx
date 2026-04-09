import React, { useEffect } from 'react';
import { Stock, PolicyNews } from '@/shared/types';
import { useUIStore } from '@/shared/stores';
import IssuesFeed from './IssuesFeed';
import PolicyNewsFeed from './PolicyNewsFeed';

interface NewsFeedContainerProps {
  stocks: Stock[];
  policyNewsItems: PolicyNews[];
  onStockClick: (stock: Stock) => void;
  isDarkMode: boolean;
  glossary: Record<string, string>;
}

const NewsFeedContainer: React.FC<NewsFeedContainerProps> = ({
  stocks,
  policyNewsItems,
  onStockClick,
  isDarkMode,
  glossary,
}) => {
  const newsSubTab = useUIStore((state) => state.newsSubTab);
  const setNewsSubTab = useUIStore((state) => state.setNewsSubTab);

  const hasPolicyNews = policyNewsItems.length > 0;

  // 정책 뉴스가 없는데 정책 탭이 선택된 경우 종목 뉴스로 전환
  useEffect(() => {
    if (!hasPolicyNews && newsSubTab === 'policy') {
      setNewsSubTab('individual');
    }
  }, [hasPolicyNews, newsSubTab, setNewsSubTab]);

  // 정책 뉴스 없으면 탭 없이 종목 뉴스만 표시
  if (!hasPolicyNews) {
    return <IssuesFeed stocks={stocks} onStockClick={onStockClick} isDarkMode={isDarkMode} glossary={glossary} />;
  }

  return (
    <div>
      {/* 탭 토글 */}
      <div className="flex justify-center mb-8">
        <div className={`inline-flex items-center rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => setNewsSubTab('individual')}
            className={`px-5 py-2 text-[13px] font-black tracking-wide transition-all rounded-lg ${
              newsSubTab === 'individual'
                ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')
            }`}
          >
            종목 뉴스
          </button>
          <div className={`w-px h-5 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />
          <button
            onClick={() => setNewsSubTab('policy')}
            className={`px-5 py-2 text-[13px] font-black tracking-wide transition-all rounded-lg ${
              newsSubTab === 'policy'
                ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')
            }`}
          >
            정책 뉴스
          </button>
        </div>
      </div>

      {/* 피드 콘텐츠 */}
      {newsSubTab === 'individual' ? (
        <IssuesFeed stocks={stocks} onStockClick={onStockClick} isDarkMode={isDarkMode} glossary={glossary} />
      ) : (
        <PolicyNewsFeed items={policyNewsItems} isDarkMode={isDarkMode} glossary={glossary} />
      )}
    </div>
  );
};

export default NewsFeedContainer;
