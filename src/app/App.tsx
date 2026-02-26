import React, { useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/shared/components';
import { ToastContainer, ConfirmDialog, SearchInput } from '@/shared/components/ui';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore, useUIStore } from '@/shared/stores';
import { Stock, SortKey } from '@/shared/types';
import { getSimplifiedSector } from '@/shared/utils';
import { AccessGate } from '@/features/auth';
import { StockList, StockDetail, SummaryCard } from '@/features/stocks';
import { usePortfolios, usePortfolioStockIds, useRecordPortfolioView } from '@/features/portfolio';
import { useStocksWithRelations } from '@/features/stocks';
import { IssuesFeed } from '@/features/issues';
import { useGlossary } from '@/features/glossary';
import { ResourcesView, useHasNewResources } from '@/features/resources';

interface PortfolioGroup {
  id: string;
  name: string;
  stocks: Stock[];
  brandColor?: string;
  returnRate: number;
}

const App: React.FC = () => {
  // Auth Store
  const isSessionValid = useAuthStore((state) => state.isSessionValid);
  const logout = useAuthStore((state) => state.logout);
  const extendSession = useAuthStore((state) => state.extendSession);
  const codeVersion = useAuthStore((state) => state.codeVersion);
  const clientInfo = useAuthStore((state) => state.clientInfo);
  const isAuthenticated = isSessionValid();

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

  // 남은 시간 상태 (1초마다 업데이트)
  const [remainingTime, setRemainingTime] = React.useState('60:00');

  // 포트폴리오별 종목 검색 상태
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});

  // TanStack Query Hooks
  const { data: portfolios = [], isLoading: portfoliosLoading } = usePortfolios();
  const portfolioIds = useMemo(() => portfolios.map(p => p.id), [portfolios]);
  const { data: portfolioStockData } = usePortfolioStockIds(portfolioIds);
  const allStockIds = portfolioStockData?.allStockIds || [];
  const stockIdsByPortfolio = portfolioStockData?.stockIdsByPortfolio || {};
  const { data: stocks = [], isLoading: stocksLoading } = useStocksWithRelations(allStockIds);
  const { data: glossary = {} } = useGlossary();
  const recordViewMutation = useRecordPortfolioView();
  const hasNewResources = useHasNewResources();

  const isLoading = portfoliosLoading || stocksLoading;

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
      };
    });
  }, [portfolios, stocks, stockIdsByPortfolio, clientInfo?.brandColor]);

  // 선택된 종목
  const selectedStock = useMemo(() => {
    return stocks.find(s => s.id === selectedStockId) || null;
  }, [stocks, selectedStockId]);

  // 세션 타이머
  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = () => {
      if (!isSessionValid()) {
        logout();
      } else {
        setRemainingTime(useAuthStore.getState().formatRemainingTime());
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, isSessionValid, logout]);

  // 세션 연장 핸들러
  const handleExtendSession = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_active_code_version');
      if (data !== null && codeVersion !== null && String(data) !== codeVersion) {
        logout();
        return;
      }
    } catch {
      // 네트워크 오류 시 그냥 연장 허용
    }
    extendSession();
    setRemainingTime(useAuthStore.getState().formatRemainingTime());
  }, [codeVersion, logout, extendSession]);

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
  };

  const handleSort = (key: SortKey) => {
    setSort(key);
  };

  const handleTogglePortfolio = (portfolioId: string) => {
    const isCurrentlyExpanded = expandedPortfolios.includes(portfolioId);
    if (!isCurrentlyExpanded) {
      recordViewMutation.mutate(portfolioId);
    }
    togglePortfolio(portfolioId);
  };

  const handleAuthenticated = () => {
    window.location.reload();
  };

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
        remainingTime={remainingTime}
        onExtendSession={handleExtendSession}
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
                {portfolioGroups.map(group => {
                  const filteredStocks = filterStocksBySearch(group.stocks, group.id);
                  const isExpanded = expandedPortfolios.includes(group.id);
                  const currentSearchQuery = searchQueries[group.id] || '';

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
                        {/* 포트폴리오별 검색창 */}
                        <div className="mt-4 mb-2">
                          <SearchInput
                            value={currentSearchQuery}
                            onChange={(value) => updateSearchQuery(group.id, value)}
                            placeholder="종목명, 티커, 섹터, 키워드로 검색..."
                            isDarkMode={isDarkMode}
                            className="w-full"
                          />
                        </div>
                        <StockList
                          stocks={sortStocks(filteredStocks)}
                          onStockSelect={handleStockSelect}
                          isDarkMode={isDarkMode}
                          sortKey={sortKey}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'ISSUES' ? (
              <IssuesFeed stocks={stocks} onStockClick={handleStockSelect} isDarkMode={isDarkMode} glossary={glossary} />
            ) : (
              <ResourcesView isDarkMode={isDarkMode} />
            )}
          </div>
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
