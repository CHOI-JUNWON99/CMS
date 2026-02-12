import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import AdminStockList from '../components/AdminStockList';
import AdminStockDetail from '../AdminStockDetail';
import { supabase } from '../../lib/supabase';
import { Stock, SortKey, SortDirection } from '../../types';

const getSimplifiedSector = (sector: string) => {
  if (sector.includes('반도체')) return '반도체';
  if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
  if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재 / 자동화';
  if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
  if (sector.includes('온라인') || sector.includes('서비스')) return '서비스 / 플랫폼';
  if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷') || sector.includes('장치')) return 'IT / 인프라';
  return sector;
};

// 종목 리스트 컴포넌트
const StockListView: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        // 종목 관리에 필요한 데이터만 가져옴
        const [stocksRes, pointsRes, segmentsRes] = await Promise.all([
          supabase.from('stocks').select('*'),
          supabase.from('investment_points').select('*').order('sort_order'),
          supabase.from('business_segments').select('*').order('sort_order'),
        ]);

        const pointsByStock: Record<string, any[]> = {};
        if (pointsRes.data) {
          pointsRes.data.forEach((p: any) => {
            if (!pointsByStock[p.stock_id]) pointsByStock[p.stock_id] = [];
            pointsByStock[p.stock_id].push({ id: p.id, title: p.title, description: p.description, sort_order: p.sort_order });
          });
        }

        const segmentsByStock: Record<string, any[]> = {};
        if (segmentsRes.data) {
          segmentsRes.data.forEach((s: any) => {
            if (!segmentsByStock[s.stock_id]) segmentsByStock[s.stock_id] = [];
            segmentsByStock[s.stock_id].push({ id: s.id, name: s.name, nameKr: s.name_kr, value: s.value, iconUrl: s.icon_url, sort_order: s.sort_order });
          });
        }

        if (stocksRes.data) {
          const assembled: Stock[] = stocksRes.data.map((row: any) => ({
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
            issues: [], // 종목 리스트에서는 issues 불필요
            businessSegments: segmentsByStock[row.id] || [],
            aiSummary: row.ai_summary || '',
            aiSummaryKeywords: row.ai_summary_keywords || [],
            lastUpdate: row.last_update,
            createdAt: row.created_at,
          }));
          setStocks(assembled);
        }
      } catch (err) {
        console.error('종목 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, [refreshKey]);

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
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
  }, [stocks, sortKey, sortDirection]);

  const handleStockSelect = (stock: Stock) => {
    navigate(`/admin/stocks/${stock.id}`);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortKey(key);
      setSortDirection(key === 'marketCapValue' || key === 'returnRate' ? 'DESC' : 'ASC');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">종목을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminStockList
      stocks={sortedStocks}
      onStockSelect={handleStockSelect}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onRefresh={refreshData}
    />
  );
};

// 종목 상세 컴포넌트
const StockDetailView: React.FC = () => {
  const { stockId } = useParams<{ stockId: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      if (!stockId) return;
      setIsLoading(true);
      try {
        const [stockRes, pointsRes, segmentsRes, issuesRes] = await Promise.all([
          supabase.from('stocks').select('*').eq('id', stockId).single(),
          supabase.from('investment_points').select('*').eq('stock_id', stockId).order('sort_order'),
          supabase.from('business_segments').select('*').eq('stock_id', stockId).order('sort_order'),
          supabase.from('issues').select('*').eq('stock_id', stockId).order('date', { ascending: false }),
        ]);

        if (stockRes.data) {
          const row = stockRes.data;
          const assembled: Stock = {
            id: row.id,
            ticker: row.ticker,
            name: row.name,
            nameKr: row.name_kr,
            sector: row.sector,
            keywords: row.keywords || [],
            investmentPoints: pointsRes.data?.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              sort_order: p.sort_order,
            })) || [],
            marketCap: row.market_cap,
            marketCapValue: row.market_cap_value || 0,
            price: 0,
            change: 0,
            returnRate: row.return_rate || 0,
            per: row.per,
            pbr: row.pbr,
            psr: row.psr,
            description: row.description,
            issues: issuesRes.data?.map((issue: any) => ({
              id: issue.id,
              title: issue.title,
              content: issue.content,
              keywords: issue.keywords || [],
              date: issue.date,
              isCMS: issue.is_cms,
              images: (issue.images || []).map((url: string) => ({ url })),
            })) || [],
            businessSegments: segmentsRes.data?.map((s: any) => ({
              id: s.id,
              name: s.name,
              nameKr: s.name_kr,
              value: s.value,
              iconUrl: s.icon_url,
              sort_order: s.sort_order,
            })) || [],
            aiSummary: row.ai_summary || '',
            aiSummaryKeywords: row.ai_summary_keywords || [],
            lastUpdate: row.last_update,
            createdAt: row.created_at,
          };
          setStock(assembled);
        }
      } catch (err) {
        console.error('종목 상세 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();
  }, [stockId, refreshKey]);

  const handleBack = () => {
    navigate('/admin/stocks');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">종목 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-20 text-slate-300">
        종목을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <AdminStockDetail
      stock={stock}
      onBack={handleBack}
      onRefresh={refreshData}
    />
  );
};

// 메인 페이지 컴포넌트
const AdminStocksPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<StockListView />} />
      <Route path="/:stockId" element={<StockDetailView />} />
    </Routes>
  );
};

export default AdminStocksPage;
