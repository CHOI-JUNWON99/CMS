import React, { useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/shared/components';
import { ToastContainer, ConfirmDialog, SearchInput } from '@/shared/components/ui';
import { useAuthStore, useUIStore } from '@/shared/stores';
import { useSlidingSession } from '@/shared/hooks/useSlidingSession';
import { Stock, SortKey } from '@/shared/types';
import { getSimplifiedSector } from '@/shared/utils';
import { AccessGate } from '@/features/auth';
import { StockList, StockDetail, SummaryCard } from '@/features/stocks';
import { usePortfolios, usePortfolioStockIds, useRecordPortfolioView } from '@/features/portfolio';
import { ETFList, ETFDetail, useEtfs } from '@/features/etf';
import type { EtfSortDirection, EtfSortKey } from '@/features/etf/components/ETFList';
import { useStocksWithRelations } from '@/features/stocks';
import { NewsFeedContainer, usePolicyNews, useLatestPolicyNews } from '@/features/issues';
import { useGlossary } from '@/features/glossary';
import { ResourcesView, useHasNewResources } from '@/features/resources';
import { useIBOpinionsInfinite, useIBDateGroups } from '@/features/ib/hooks/useIBOpinions';
import IBStockList from '@/features/ib/components/IBStockList';
import IBStockDetail from '@/features/ib/components/IBStockDetail';
import { filterIBOpinions } from '@/features/ib/utils/filterIBOpinions';

interface PortfolioGroup {
  id: string;
  name: string;
  stocks: Stock[];
  brandColor?: string;
  returnRate: number;
  portfolioType: string;
}

const ETF_PORTFOLIO_ID = '__etf_portfolio__';

const App: React.FC = () => {
  // Auth Store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const extendSession = useAuthStore((state) => state.extendSession);
  const clientInfo = useAuthStore((state) => state.clientInfo);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // Sliding Session: 활동 감지 시 자동 갱신
  useSlidingSession({ isAuthenticated, extendSession, logout });

  // UI Store
  const viewMode = useUIStore((state) => state.viewMode);
  const setViewMode = useUIStore((state) => state.setViewMode);
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode);
  const sortKey = useUIStore((state) => state.sortKey);
  const sortDirection = useUIStore((state) => state.sortDirection);
  const setSort = useUIStore((state) => state.setSort);
  const expandedPortfolios = useUIStore((state) => state.expandedPortfolios);
  const togglePortfolio = useUIStore((state) => state.togglePortfolio);
  const resetExpandedPortfolios = useUIStore((state) => state.resetExpandedPortfolios);
  const selectedStockId = useUIStore((state) => state.selectedStockId);
  const setSelectedStockId = useUIStore((state) => state.setSelectedStockId);
  const selectedEtfId = useUIStore((state) => state.selectedEtfId);
  const setSelectedEtfId = useUIStore((state) => state.setSelectedEtfId);

  // 세션 복원
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 포트폴리오별 종목 검색 상태
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});

  // TanStack Query Hooks
  const { data: portfolios = [], isLoading: portfoliosLoading } = usePortfolios();
  const portfolioIds = useMemo(() => portfolios.map(p => p.id), [portfolios]);
  const { data: portfolioStockData, isLoading: portfolioStockIdsLoading } = usePortfolioStockIds(portfolioIds);
  const allStockIds = portfolioStockData?.allStockIds || [];
  const stockIdsByPortfolio = portfolioStockData?.stockIdsByPortfolio || {};
  const { data: stocks = [], isLoading: stocksLoading } = useStocksWithRelations(allStockIds);
  const { data: glossary = {} } = useGlossary();
  const { data: etfs = [], isLoading: etfsLoading } = useEtfs();
  const recordViewMutation = useRecordPortfolioView();
  const { data: policyNewsItems = [] } = usePolicyNews();
  const { data: latestPolicyNews } = useLatestPolicyNews();
  const hasNewResources = useHasNewResources();
  const setNewsSubTab = useUIStore((state) => state.setNewsSubTab);
  const ibQuery = useIBOpinionsInfinite();
  const ibDateGroups = useIBDateGroups(ibQuery);
  const [selectedIBStock, setSelectedIBStock] = React.useState<{ ticker: string; stockName: string; sector: string; opinionId: string } | null>(null);
  const [ibSearchQuery, setIbSearchQuery] = React.useState('');
  const [etfSearchQuery, setEtfSearchQuery] = React.useState('');
  const [etfSortKey, setEtfSortKey] = React.useState<EtfSortKey>('nameEn');
  const [etfSortDirection, setEtfSortDirection] = React.useState<EtfSortDirection>('ASC');

  const isLoading = portfoliosLoading || portfolioStockIdsLoading || stocksLoading || etfsLoading;

  // 포트폴리오별 검색어 업데이트 함수
  const updateSearchQuery = useCallback((portfolioId: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [portfolioId]: query }));
  }, []);

  // 종목 검색 필터링 함수
  const filterStocksBySearch = useCallback((stockList: Stock[], portfolioId: string) => {
    const query = (searchQueries[portfolioId] || '').trim().toLowerCase();
    if (!query) return stockList;
    return stockList.filter(stock =>
      stock.nameKr.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.ticker.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query) ||
      stock.keywords?.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQueries]);

  // 포트폴리오 그룹 생성 (수익률은 종목들의 YTD 합계로 자동 계산)
  const portfolioGroups = useMemo((): PortfolioGroup[] => {
    return portfolios.map(p => {
      const portfolioStocks = stocks.filter(s => (stockIdsByPortfolio[p.id] || []).includes(s.id));
      const totalReturnRate = portfolioStocks.reduce((sum, stock) => sum + (stock.returnRate || 0), 0);
      return {
        id: p.id,
        name: p.name,
        stocks: portfolioStocks,
        brandColor: p.brandColor || clientInfo?.brandColor,
        returnRate: totalReturnRate,
        portfolioType: p.portfolioType,
      };
    });
  }, [portfolios, stocks, stockIdsByPortfolio, clientInfo?.brandColor]);

  // 최신 종목 뉴스 (포트폴리오 카드용, 최대 2개)
  const latestStockNews = useMemo((): { stockName: string; title?: string; content: string; date: string }[] => {
    const all: { stockName: string; title?: string; content: string; date: string }[] = [];
    for (const stock of stocks) {
      if (stock.issues && stock.issues.length > 0) {
        for (const issue of stock.issues) {
          all.push({ stockName: stock.nameKr, title: issue.title, content: issue.content, date: issue.date });
        }
      }
    }
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  }, [stocks]);

  // 선택된 종목
  const selectedStock = useMemo(() => {
    return stocks.find(s => s.id === selectedStockId) || null;
  }, [stocks, selectedStockId]);

  const selectedEtf = useMemo(() => {
    return etfs.find(etf => etf.id === selectedEtfId) || null;
  }, [etfs, selectedEtfId]);

  const filteredEtfs = useMemo(() => {
    const query = etfSearchQuery.trim().toLowerCase();
    const filtered = !query ? etfs : etfs.filter(etf =>
      [etf.code, etf.nameEn, etf.sector, etf.categoryLarge, etf.categorySmall]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    );

    return [...filtered].sort((a, b) => {
      const direction = etfSortDirection === 'ASC' ? 1 : -1;

      if (etfSortKey === 'sector') {
        const valueA = (a.sector || '').toLowerCase();
        const valueB = (b.sector || '').toLowerCase();
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
      }

      if (etfSortKey === 'nameEn') {
        const valueA = a.nameEn.toLowerCase();
        const valueB = b.nameEn.toLowerCase();
        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
      }

      const valueA = a[etfSortKey] ?? Number.NEGATIVE_INFINITY;
      const valueB = b[etfSortKey] ?? Number.NEGATIVE_INFINITY;
      return ((Number(valueA) || 0) - (Number(valueB) || 0)) * direction;
    });
  }, [etfs, etfSearchQuery, etfSortDirection, etfSortKey]);

  const handleEtfSort = React.useCallback((key: EtfSortKey) => {
    if (etfSortKey === key) {
      setEtfSortDirection((currentDirection) => currentDirection === 'ASC' ? 'DESC' : 'ASC');
      return;
    }

    setEtfSortKey(key);
    setEtfSortDirection(
      key === 'aumKrwBillion' ||
      key === 'avgTradingValueYtdBillion' ||
      key === 'return1M' ||
      key === 'return3M' ||
      key === 'return6M' ||
      key === 'return1Y'
        ? 'DESC'
        : 'ASC'
    );
  }, [etfSortKey]);

  const filteredIBDateGroups = useMemo(() => {
    const query = ibSearchQuery.trim();
    if (!query) return ibDateGroups;

    return ibDateGroups
      .map((group) => ({
        ...group,
        opinions: filterIBOpinions(group.opinions, query),
      }))
      .filter((group) => group.opinions.length > 0);
  }, [ibDateGroups, ibSearchQuery]);

  // 세션 만료 체크 (60초 간격)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const state = useAuthStore.getState();
      if (!state.isSessionValid()) {
        logout();
      }
    };

    const id = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, logout]);

  // 정렬 함수
  const sortStocks = useCallback((list: Stock[]) => {
    return [...list].sort((a, b) => {
      if (sortKey === 'sector') {
        const sectorA = getSimplifiedSector(a.sector);
        const sectorB = getSimplifiedSector(b.sector);
        if (sectorA < sectorB) return sortDirection === 'ASC' ? -1 : 1;
        if (sectorA > sectorB) return sortDirection === 'ASC' ? 1 : -1;
        return b.marketCapValue - a.marketCapValue;
      }

      let valA: string | number = sortKey === 'keywords'
        ? (a.keywords[0] || '')
        : (a[sortKey as keyof Stock] as string | number) ?? 0;
      let valB: string | number = sortKey === 'keywords'
        ? (b.keywords[0] || '')
        : (b[sortKey as keyof Stock] as string | number) ?? 0;
      if (valA < valB) return sortDirection === 'ASC' ? -1 : 1;
      if (valA > valB) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortDirection]);

  // 이벤트 핸들러
  const handleStockSelect = (stock: Stock) => {
    setSelectedStockId(stock.id);
    setViewMode('DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setViewMode('DASHBOARD');
    setSelectedStockId(null);
    setSelectedEtfId(null);
    setSelectedIBStock(null);
  };

  const handleEtfSelect = (etfId: string) => {
    setSelectedEtfId(etfId);
    setViewMode('ETF_DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIBStockSelect = (opinion: { id: string; ticker: string; stockName: string; sector: string }) => {
    setSelectedIBStock({ ticker: opinion.ticker, stockName: opinion.stockName, sector: opinion.sector, opinionId: opinion.id });
    setViewMode('IB_DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (key: SortKey) => {
    setSort(key);
  };

  const handleTogglePortfolio = (portfolioId: string) => {
    const isCurrentlyExpanded = expandedPortfolios.includes(portfolioId);
    if (!isCurrentlyExpanded && portfolioId !== ETF_PORTFOLIO_ID) {
      recordViewMutation.mutate(portfolioId);
    }
    togglePortfolio(portfolioId);
  };

  const handleAuthenticated = () => {
    // 인메모리 스토어이므로 reload 대신 상태 변경으로 자동 전환
  };

  // 세션 복원 중
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 미인증 → 인증코드 입력 화면
  if (!isAuthenticated) {
    return <AccessGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-[#0a192f] text-slate-100' : 'bg-white text-gray-900'}`}>
      <Header
        onHomeClick={handleBackToDashboard}
        isDarkMode={isDarkMode}
        toggleTheme={toggleDarkMode}
        onLogout={logout}
      />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>데이터를 불러오는 중...</span>
            </div>
          </div>
        ) : viewMode === 'DASHBOARD' ? (
          <div className="animate-in fade-in duration-700">
            <nav className={`flex gap-10 mb-8 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <button
                onClick={() => { setActiveTab('PORTFOLIO'); resetExpandedPortfolios(); }}
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'PORTFOLIO' ? (isDarkMode ? 'text-slate-200' : 'text-accent') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                PORTFOLIO {activeTab === 'PORTFOLIO' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab('ISSUES')}
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'ISSUES' ? (isDarkMode ? 'text-slate-200' : 'text-accent') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                NEWS {activeTab === 'ISSUES' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab('RESOURCES')}
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'RESOURCES' ? (isDarkMode ? 'text-slate-200' : 'text-accent') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                <span className="relative">
                  RESOURCES
                  {hasNewResources && activeTab !== 'RESOURCES' && (
                    <span className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </span>
                {activeTab === 'RESOURCES' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent rounded-full" />}
              </button>
            </nav>
            {activeTab === 'PORTFOLIO' ? (
              <div className="flex flex-col">
                {/* 최신 뉴스 미리보기 카드 */}
                {(latestStockNews.length > 0 || latestPolicyNews) && (() => {
                  // 정책 뉴스 있으면: 종목 1개 + 정책 1개, 없으면: 종목 2개
                  const stockCardsToShow = latestPolicyNews ? latestStockNews.slice(0, 1) : latestStockNews.slice(0, 2);
                  return (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8`}>
                      {stockCardsToShow.map((news, idx) => (
                        <button
                          key={`stock-news-${idx}`}
                          onClick={() => { setActiveTab('ISSUES'); setNewsSubTab('individual'); }}
                          className={`text-left p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                            isDarkMode ? 'bg-[#112240] border-slate-700 hover:border-slate-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                              종목 뉴스
                            </span>
                            <span className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{news.date}</span>
                          </div>
                          <p className={`text-[11px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{news.stockName}</p>
                          <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {news.title || news.content}
                          </p>
                          <p className={`text-xs mt-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {news.title ? news.content : ''}
                          </p>
                        </button>
                      ))}
                      {latestPolicyNews && (
                        <button
                          onClick={() => { setActiveTab('ISSUES'); setNewsSubTab('policy'); }}
                          className={`text-left p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                            isDarkMode ? 'bg-[#112240] border-slate-700 hover:border-slate-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-purple-900/40 text-purple-300 border border-purple-700' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                              정책 뉴스
                            </span>
                            <span className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{latestPolicyNews.date}</span>
                          </div>
                          <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {latestPolicyNews.title || latestPolicyNews.content}
                          </p>
                          <p className={`text-xs mt-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {latestPolicyNews.title ? latestPolicyNews.content : ''}
                          </p>
                        </button>
                      )}
                    </div>
                  );
                })()}
                {portfolioGroups.map(group => {
                  const isExpanded = expandedPortfolios.includes(group.id);
                  const isIB = group.portfolioType === 'ib';

                  return (
                    <div key={group.id} className="mb-10">
                      <SummaryCard
                        averageReturn={group.returnRate}
                        isDarkMode={isDarkMode}
                        isExpanded={isExpanded}
                        onToggle={() => handleTogglePortfolio(group.id)}
                        portfolioName={group.name}
                        brandColor={group.brandColor}
                      />
                      <div className={`transition-all duration-700 ease-in-out origin-top ${
                        isExpanded
                          ? 'opacity-100 scale-100 translate-y-0 visible'
                          : 'opacity-0 scale-95 -translate-y-10 invisible h-0 overflow-hidden'
                      }`}>
                        {isIB ? (
                          <div className="mt-4">
                            <div className="mb-2">
                              <SearchInput
                                value={ibSearchQuery}
                                onChange={setIbSearchQuery}
                                placeholder="종목명, 티커, 섹터, IB, 의견, 애널리스트, 코멘트로 검색..."
                                isDarkMode={isDarkMode}
                                className="w-full"
                              />
                            </div>
                            <IBStockList
                              dateGroups={filteredIBDateGroups}
                              onSelect={handleIBStockSelect}
                              isDarkMode={isDarkMode}
                              hasNextPage={!!ibQuery.hasNextPage}
                              isFetchingNextPage={ibQuery.isFetchingNextPage}
                              fetchNextPage={() => ibQuery.fetchNextPage()}
                              searchQuery={ibSearchQuery}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 mb-2">
                              <SearchInput
                                value={searchQueries[group.id] || ''}
                                onChange={(value) => updateSearchQuery(group.id, value)}
                                placeholder="종목명, 티커, 섹터, 키워드로 검색..."
                                isDarkMode={isDarkMode}
                                className="w-full"
                              />
                            </div>
                            <StockList
                              stocks={sortStocks(filterStocksBySearch(group.stocks, group.id))}
                              onStockSelect={handleStockSelect}
                              isDarkMode={isDarkMode}
                              sortKey={sortKey}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {etfs.length > 0 && (
                  <div className="mb-10">
                    <SummaryCard
                      averageReturn={0}
                      isDarkMode={isDarkMode}
                      isExpanded={expandedPortfolios.includes(ETF_PORTFOLIO_ID)}
                      onToggle={() => handleTogglePortfolio(ETF_PORTFOLIO_ID)}
                      portfolioName="ETF"
                      brandColor={clientInfo?.brandColor}
                    />
                    <div className={`transition-all duration-700 ease-in-out origin-top ${
                      expandedPortfolios.includes(ETF_PORTFOLIO_ID)
                        ? 'opacity-100 scale-100 translate-y-0 visible'
                        : 'opacity-0 scale-95 -translate-y-10 invisible h-0 overflow-hidden'
                    }`}>
                      <div className="mt-4 mb-2">
                        <SearchInput
                          value={etfSearchQuery}
                          onChange={setEtfSearchQuery}
                          placeholder="ETF 코드, 명칭, 섹터, 카테고리로 검색..."
                          isDarkMode={isDarkMode}
                          className="w-full"
                        />
                      </div>
                      <ETFList
                        etfs={filteredEtfs}
                        onSelect={(etf) => handleEtfSelect(etf.id)}
                        isDarkMode={isDarkMode}
                        sortKey={etfSortKey}
                        sortDirection={etfSortDirection}
                        onSort={handleEtfSort}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'ISSUES' ? (
              <NewsFeedContainer stocks={stocks} policyNewsItems={policyNewsItems} onStockClick={handleStockSelect} isDarkMode={isDarkMode} glossary={glossary} />
            ) : (
              <ResourcesView isDarkMode={isDarkMode} />
            )}
          </div>
        ) : viewMode === 'IB_DETAIL' ? (
          selectedIBStock && <IBStockDetail ticker={selectedIBStock.ticker} stockName={selectedIBStock.stockName} sector={selectedIBStock.sector} opinionId={selectedIBStock.opinionId} onBack={handleBackToDashboard} isDarkMode={isDarkMode} />
        ) : viewMode === 'ETF_DETAIL' ? (
          selectedEtf && <ETFDetail etf={selectedEtf} onBack={handleBackToDashboard} isDarkMode={isDarkMode} />
        ) : (
          selectedStock && <StockDetail stock={selectedStock} onBack={handleBackToDashboard} isDarkMode={isDarkMode} glossary={glossary} />
        )}
      </main>
      <footer className={`py-12 border-t mt-20 ${isDarkMode ? 'bg-[#0a192f] border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 font-medium">© 2026 CMS Securities. All rights reserved.</p>
        </div>
      </footer>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
};

export default App;
