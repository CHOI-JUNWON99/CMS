import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import AdminStockList from './components/AdminStockList';
import AdminStockDetail from './AdminStockDetail';
import { supabase } from '@/shared/lib/supabase';
import {
  Stock,
  SortKey,
  SortDirection,
  DbStockRow,
  DbInvestmentPointRow,
  DbBusinessSegmentRow,
  DbIssueRow,
  InvestmentPoint,
  BusinessSegment,
} from '@/shared/types';
import { getSimplifiedSector } from '@/shared/utils';

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

        const pointsByStock: Record<string, InvestmentPoint[]> = {};
        if (pointsRes.data) {
          (pointsRes.data as DbInvestmentPointRow[]).forEach((p) => {
            if (!pointsByStock[p.stock_id]) pointsByStock[p.stock_id] = [];
            pointsByStock[p.stock_id].push({ title: p.title, description: p.description });
          });
        }

        const segmentsByStock: Record<string, BusinessSegment[]> = {};
        if (segmentsRes.data) {
          (segmentsRes.data as DbBusinessSegmentRow[]).forEach((s) => {
            if (!segmentsByStock[s.stock_id]) segmentsByStock[s.stock_id] = [];
            segmentsByStock[s.stock_id].push({ id: s.id, name: s.name, nameKr: s.name_kr, value: s.value, iconUrl: s.icon_url ?? undefined });
          });
        }

        if (stocksRes.data) {
          const assembled: Stock[] = (stocksRes.data as DbStockRow[]).map((row) => ({
            id: row.id,
            ticker: row.ticker,
            tickers: (row.tickers && row.tickers.length > 0) ? row.tickers : [row.ticker],
            name: row.name,
            nameKr: row.name_kr,
            sector: row.sector,
            keywords: row.keywords || [],
            investmentPoints: pointsByStock[row.id] || [],
            marketCap: row.market_cap ?? '',
            marketCapValue: row.market_cap_value || 0,
            price: 0,
            change: 0,
            returnRate: row.return_rate ?? undefined,
            per: row.per ?? undefined,
            pbr: row.pbr ?? undefined,
            psr: row.psr ?? undefined,
            description: row.description ?? '',
            issues: [], // 종목 리스트에서는 issues 불필요
            businessSegments: segmentsByStock[row.id] || [],
            aiSummary: row.ai_summary || '',
            aiSummaryKeywords: row.ai_summary_keywords || [],
            lastUpdate: row.last_update ?? undefined,
            createdAt: row.created_at ?? undefined,
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
            tickers: (row.tickers && row.tickers.length > 0) ? row.tickers : [row.ticker],
            name: row.name,
            nameKr: row.name_kr,
            sector: row.sector,
            keywords: row.keywords || [],
            investmentPoints: (pointsRes.data as DbInvestmentPointRow[] || []).map((p) => ({
              title: p.title,
              description: p.description,
            })),
            marketCap: row.market_cap ?? '',
            marketCapValue: row.market_cap_value || 0,
            price: 0,
            change: 0,
            returnRate: row.return_rate ?? undefined,
            per: row.per ?? undefined,
            pbr: row.pbr ?? undefined,
            psr: row.psr ?? undefined,
            description: row.description ?? '',
            issues: (issuesRes.data as DbIssueRow[] || []).map((issue) => ({
              id: issue.id,
              title: issue.title ?? undefined,
              content: issue.content,
              keywords: issue.keywords || [],
              date: issue.date,
              isCMS: issue.is_cms ?? false,
              images: (issue.images || []).map((img) => ({
                url: typeof img === 'string' ? img : img.url,
                source: typeof img === 'string' ? '' : img.source || '',
                date: issue.date,
              })),
            })),
            businessSegments: (segmentsRes.data as DbBusinessSegmentRow[] || []).map((s) => ({
              id: s.id,
              name: s.name,
              nameKr: s.name_kr,
              value: s.value,
              iconUrl: s.icon_url ?? undefined,
            })),
            aiSummary: row.ai_summary || '',
            aiSummaryKeywords: row.ai_summary_keywords || [],
            lastUpdate: row.last_update ?? undefined,
            createdAt: row.created_at ?? undefined,
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
