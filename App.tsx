import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import SummaryCard from '@/components/SummaryCard';
import StockList from '@/components/StockList';
import StockDetail from '@/components/StockDetail';
import IssuesFeed from '@/components/IssuesFeed';
import ResourcesView from '@/components/ResourcesView';
import { CHINA_STOCKS } from '@/constants';
import { Stock, ViewMode, MainTab, SortKey, SortDirection } from '@/types';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<MainTab>('PORTFOLIO');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');
  
  const [isPortfolioExpanded, setIsPortfolioExpanded] = useState<boolean>(false);

  const getSimplifiedSector = (sector: string) => {
    if (sector.includes('반도체')) return '반도체';
    if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
    if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재 / 자동화';
    if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
    if (sector.includes('온라인') || sector.includes('서비스')) return '서비스 / 플랫폼';
    if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷') || sector.includes('장치')) return 'IT / 인프라';
    return sector;
  };

  const sortedStocks = useMemo(() => {
    return [...CHINA_STOCKS].sort((a, b) => {
      if (sortKey === 'sector') {
        const sectorA = getSimplifiedSector(a.sector);
        const sectorB = getSimplifiedSector(b.sector);
        if (sectorA < sectorB) return sortDirection === 'ASC' ? -1 : 1;
        if (sectorA > sectorB) return sortDirection === 'ASC' ? 1 : -1;
        return b.marketCapValue - a.marketCapValue;
      }

      let valA: any = a[sortKey];
      let valB: any = b[sortKey];
      if (sortKey === 'keywords') {
        valA = a.keywords[0] || '';
        valB = b.keywords[0] || '';
      }
      if (valA < valB) return sortDirection === 'ASC' ? -1 : 1;
      if (valA > valB) return sortDirection === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortDirection]);

  const averageReturn = useMemo(() => {
    const sum = CHINA_STOCKS.reduce((acc, stock) => acc + (stock.returnRate || 0), 0);
    return sum / CHINA_STOCKS.length;
  }, []);

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setViewMode('DETAIL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setViewMode('DASHBOARD');
    setSelectedStock(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortKey(key);
      setSortDirection(key === 'marketCapValue' || key === 'change' ? 'DESC' : 'ASC');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-[#0a192f] text-slate-100' : 'bg-white text-gray-900'}`}>
      <Header onHomeClick={handleBackToDashboard} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {viewMode === 'DASHBOARD' ? (
          <div className="animate-in fade-in duration-700">
            <nav className={`flex gap-10 mb-8 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <button 
                onClick={() => { setActiveTab('PORTFOLIO'); setIsPortfolioExpanded(false); }} 
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'PORTFOLIO' ? (isDarkMode ? 'text-blue-400' : 'text-blue-900') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                PORTFOLIO {activeTab === 'PORTFOLIO' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('ISSUES')} 
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'ISSUES' ? (isDarkMode ? 'text-blue-400' : 'text-blue-900') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                MARKET INSIGHTS {activeTab === 'ISSUES' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('RESOURCES')} 
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'RESOURCES' ? (isDarkMode ? 'text-blue-400' : 'text-blue-900') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                RESOURCES {activeTab === 'RESOURCES' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-900 rounded-full" />}
              </button>
            </nav>
            {activeTab === 'PORTFOLIO' ? (
              <div className="flex flex-col">
                <SummaryCard 
                  averageReturn={averageReturn} 
                  isDarkMode={isDarkMode} 
                  isExpanded={isPortfolioExpanded}
                  onToggle={() => setIsPortfolioExpanded(!isPortfolioExpanded)}
                />
                <div className={`transition-all duration-700 ease-in-out origin-top ${
                  isPortfolioExpanded 
                    ? 'opacity-100 scale-100 translate-y-0 visible' 
                    : 'opacity-0 scale-95 -translate-y-10 invisible h-0 overflow-hidden'
                }`}>
                  <StockList 
                    stocks={sortedStocks} 
                    onStockSelect={handleStockSelect} 
                    isDarkMode={isDarkMode} 
                    sortKey={sortKey} 
                    sortDirection={sortDirection} 
                    onSort={handleSort} 
                  />
                </div>
              </div>
            ) : activeTab === 'ISSUES' ? (
              <IssuesFeed stocks={CHINA_STOCKS} onStockClick={handleStockSelect} isDarkMode={isDarkMode} />
            ) : (
              <ResourcesView isDarkMode={isDarkMode} />
            )}
          </div>
        ) : (
          selectedStock && <StockDetail stock={selectedStock} onBack={handleBackToDashboard} isDarkMode={isDarkMode} />
        )}
      </main>
      <footer className={`py-12 border-t mt-20 ${isDarkMode ? 'bg-[#0a192f] border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400 font-medium">© 2024 CMS Securities. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
