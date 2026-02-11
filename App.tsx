import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import SummaryCard from '@/components/SummaryCard';
import StockList from '@/components/StockList';
import StockDetail from '@/components/StockDetail';
import IssuesFeed from '@/components/IssuesFeed';
import ResourcesView from '@/components/ResourcesView';
import AccessGate from '@/components/AccessGate';
import { supabase } from '@/lib/supabase';
import { Stock, ViewMode, MainTab, SortKey, SortDirection } from '@/types';

interface PortfolioGroup {
  id: string;
  name: string;
  stocks: Stock[];
}

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1시간

function clearSession() {
  localStorage.removeItem('cms_authenticated');
  localStorage.removeItem('cms_expires_at');
  localStorage.removeItem('cms_code_version');
  localStorage.removeItem('cms_client_id');
  localStorage.removeItem('cms_client_name');
  localStorage.removeItem('cms_client_logo');
  localStorage.removeItem('cms_client_brand_color');
}

function isSessionValid(): boolean {
  const auth = localStorage.getItem('cms_authenticated');
  const expiresAt = localStorage.getItem('cms_expires_at');
  if (auth !== 'true' || !expiresAt) return false;
  return Date.now() < Number(expiresAt);
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isSessionValid);
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<MainTab>('PORTFOLIO');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');

  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set());
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<string>('60:00');

  const [portfolioGroups, setPortfolioGroups] = useState<PortfolioGroup[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [glossary, setGlossary] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientBrandColor, setClientBrandColor] = useState<string | null>(null);

  // 클라이언트 브랜드 색상 로드
  useEffect(() => {
    if (isAuthenticated) {
      setClientBrandColor(localStorage.getItem('cms_client_brand_color'));
    }
  }, [isAuthenticated]);

  // 로그아웃 처리
  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
  }, []);

  // 1초마다 남은 시간 갱신
  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = () => {
      const expiresAt = Number(localStorage.getItem('cms_expires_at') || '0');
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        logout();
      } else {
        setRemainingTime(formatRemaining(diff));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, logout]);

  // 세션 연장 — 버전 체크 후 연장 또는 로그아웃
  const handleExtendSession = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_active_code_version');
      const storedVersion = localStorage.getItem('cms_code_version');
      if (data !== null && storedVersion !== null && String(data) !== storedVersion) {
        logout();
        return;
      }
    } catch {
      // 네트워크 오류 시 그냥 연장 허용
    }
    const newExpiry = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem('cms_expires_at', String(newExpiry));
    setRemainingTime(formatRemaining(SESSION_DURATION_MS));
  }, [logout]);

  // 방문자 수 조회
  const fetchVisitorCount = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_visitor_count');
      if (data !== null) setVisitorCount(Number(data));
    } catch {
      // 실패 시 무시
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVisitorCount();
    }
  }, [isAuthenticated, fetchVisitorCount]);

  // Supabase 데이터 페칭
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 클라이언트 ID 가져오기
        const clientId = localStorage.getItem('cms_client_id');

        // 활성화된 포트폴리오 조회 (클라이언트별 필터링)
        let portfolioQuery = supabase
          .from('portfolios')
          .select('id, name')
          .eq('is_active', true);

        // 클라이언트 ID가 있으면 해당 클라이언트의 포트폴리오만 가져옴
        if (clientId) {
          portfolioQuery = portfolioQuery.eq('client_id', clientId);
        }

        const { data: activePortfolios } = await portfolioQuery;

        // 포트폴리오별 종목 ID 매핑
        const portfolioStockMap: Record<string, string[]> = {};
        let accessibleStockIds: string[] = [];

        if (activePortfolios && activePortfolios.length > 0) {
          const portfolioIds = activePortfolios.map(p => p.id);
          const { data: portfolioStocks } = await supabase
            .from('portfolio_stocks')
            .select('portfolio_id, stock_id')
            .in('portfolio_id', portfolioIds);

          if (portfolioStocks) {
            portfolioStocks.forEach((ps: any) => {
              if (!portfolioStockMap[ps.portfolio_id]) portfolioStockMap[ps.portfolio_id] = [];
              portfolioStockMap[ps.portfolio_id].push(ps.stock_id);
              accessibleStockIds.push(ps.stock_id);
            });
            // 중복 제거
            accessibleStockIds = [...new Set(accessibleStockIds)];
          }
        }

        // 접근 가능한 종목만 로드 (클라이언트가 설정된 경우)
        let stocksQuery = supabase.from('stocks').select('*');
        if (clientId && accessibleStockIds.length > 0) {
          stocksQuery = stocksQuery.in('id', accessibleStockIds);
        } else if (clientId && accessibleStockIds.length === 0) {
          // 클라이언트가 설정되었지만 접근 가능한 종목이 없는 경우
          setAllStocks([]);
          setPortfolioGroups([]);
          setIsLoading(false);
          return;
        }

        const [stocksRes, pointsRes, segmentsRes, issuesRes, glossaryRes] = await Promise.all([
          stocksQuery,
          supabase.from('investment_points').select('*').order('sort_order'),
          supabase.from('business_segments').select('*').order('sort_order'),
          supabase.from('issues').select('*').order('date', { ascending: false }),
          supabase.from('glossary').select('*'),
        ]);

        // 용어사전
        if (glossaryRes.data) {
          const g: Record<string, string> = {};
          glossaryRes.data.forEach((row: { term: string; definition: string }) => {
            g[row.term] = row.definition;
          });
          setGlossary(g);
        }

        // 이슈를 stock_id로 그룹 (이미지 URL은 DB에서 직접 가져옴)
        const issuesByStock: Record<string, any[]> = {};
        if (issuesRes.data) {
          issuesRes.data.forEach((issue: any) => {
            // images 컬럼: string[] 형태의 URL 배열
            const imageUrls = issue.images || [];
            const mapped = {
              id: issue.id,
              title: issue.title,
              content: issue.content,
              keywords: issue.keywords || [],
              date: issue.date,
              createdAt: issue.created_at,
              updatedAt: issue.updated_at,
              isCMS: issue.is_cms,
              images: imageUrls.map((url: string) => ({ url })),
            };
            if (!issuesByStock[issue.stock_id]) issuesByStock[issue.stock_id] = [];
            issuesByStock[issue.stock_id].push(mapped);
          });
        }

        // 투자포인트를 stock_id로 그룹
        const pointsByStock: Record<string, any[]> = {};
        if (pointsRes.data) {
          pointsRes.data.forEach((p: any) => {
            if (!pointsByStock[p.stock_id]) pointsByStock[p.stock_id] = [];
            pointsByStock[p.stock_id].push({ title: p.title, description: p.description });
          });
        }

        // 사업부문을 stock_id로 그룹
        const segmentsByStock: Record<string, any[]> = {};
        if (segmentsRes.data) {
          segmentsRes.data.forEach((s: any) => {
            if (!segmentsByStock[s.stock_id]) segmentsByStock[s.stock_id] = [];
            segmentsByStock[s.stock_id].push({ id: s.id, name: s.name, nameKr: s.name_kr, value: s.value, iconUrl: s.icon_url });
          });
        }

        // Stock 객체 조립
        if (stocksRes.data) {
          const mapRow = (row: any): Stock => ({
            id: row.id,
            ticker: row.ticker,
            name: row.name,
            nameKr: row.name_kr,
            sector: row.sector,
            keywords: row.keywords || [],
            investmentPoints: pointsByStock[row.id] || [],
            marketCap: row.market_cap,
            marketCapValue: row.market_cap_value || 0,
            price: 0,
            change: 0,
            returnRate: row.return_rate || 0,
            per: row.per,
            pbr: row.pbr,
            psr: row.psr,
            description: row.description,
            issues: issuesByStock[row.id] || [],
            businessSegments: segmentsByStock[row.id] || [],
            aiSummary: row.ai_summary || '',
            aiSummaryKeywords: row.ai_summary_keywords || [],
          });

          const all = stocksRes.data.map(mapRow);
          setAllStocks(all);

          // 포트폴리오별 그룹 생성
          if (activePortfolios && activePortfolios.length > 0) {
            const groups: PortfolioGroup[] = activePortfolios.map(p => ({
              id: p.id,
              name: p.name,
              stocks: all.filter(s => (portfolioStockMap[p.id] || []).includes(s.id)),
            }));
            setPortfolioGroups(groups);
          } else {
            setPortfolioGroups([]);
          }
        }
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // 인증 성공 핸들러
  const handleAuthenticated = async () => {
    setIsAuthenticated(true);
    try {
      await supabase.rpc('record_visit');
    } catch {
      // 실패 시 무시
    }
    fetchVisitorCount();
  };

  const getSimplifiedSector = (sector: string) => {
    if (sector.includes('반도체')) return '반도체';
    if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
    if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재 / 자동화';
    if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
    if (sector.includes('온라인') || sector.includes('서비스')) return '서비스 / 플랫폼';
    if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷') || sector.includes('장치')) return 'IT / 인프라';
    return sector;
  };

  const sortStocks = useCallback((list: Stock[]) => {
    return [...list].sort((a, b) => {
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

  const getAverageReturn = (list: Stock[]) => {
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, stock) => acc + (stock.returnRate || 0), 0);
    return sum / list.length;
  };

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
      setSortDirection(key === 'marketCapValue' || key === 'returnRate' ? 'DESC' : 'ASC');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 미인증 → 인증코드 입력 화면
  if (!isAuthenticated) {
    return <AccessGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-[#0a192f] text-slate-100' : 'bg-white text-gray-900'}`}>
      <Header
        onHomeClick={handleBackToDashboard}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        visitorCount={visitorCount}
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
                onClick={() => { setActiveTab('PORTFOLIO'); setExpandedPortfolios(new Set()); }}
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'PORTFOLIO' ? (isDarkMode ? 'text-blue-400' : 'text-blue-900') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                PORTFOLIO {activeTab === 'PORTFOLIO' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-900 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveTab('ISSUES')}
                className={`pb-4 text-[13px] font-black tracking-wider transition-all relative ${activeTab === 'ISSUES' ? (isDarkMode ? 'text-blue-400' : 'text-blue-900') : (isDarkMode ? 'text-slate-500' : 'text-gray-400')}`}
              >
                NEWS {activeTab === 'ISSUES' && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-900 rounded-full" />}
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
                {portfolioGroups.map(group => {
                  const isExpanded = expandedPortfolios.has(group.id);
                  return (
                    <div key={group.id} className="mb-10">
                      <SummaryCard
                        averageReturn={getAverageReturn(group.stocks)}
                        isDarkMode={isDarkMode}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedPortfolios(prev => {
                          const next = new Set(prev);
                          if (next.has(group.id)) next.delete(group.id);
                          else next.add(group.id);
                          return next;
                        })}
                        portfolioName={group.name}
                        brandColor={clientBrandColor}
                      />
                      <div className={`transition-all duration-700 ease-in-out origin-top ${
                        isExpanded
                          ? 'opacity-100 scale-100 translate-y-0 visible'
                          : 'opacity-0 scale-95 -translate-y-10 invisible h-0 overflow-hidden'
                      }`}>
                        <StockList
                          stocks={sortStocks(group.stocks)}
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
              <IssuesFeed stocks={allStocks} onStockClick={handleStockSelect} isDarkMode={isDarkMode} glossary={glossary} />
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
          <p className="text-sm text-gray-400 font-medium">© 2024 CMS Securities. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
