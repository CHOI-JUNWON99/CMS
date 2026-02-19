import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import {
  Stock,
  InvestmentPoint,
  BusinessSegment,
  StockIssue,
  IssueImage,
  DbStockRow,
  DbInvestmentPointRow,
  DbBusinessSegmentRow,
  DbIssueRow,
} from '@/shared/types';

// Query Keys
export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (stockIds: string[]) => [...stockKeys.lists(), stockIds] as const,
  detail: (id: string) => [...stockKeys.all, 'detail', id] as const,
  withRelations: (stockIds: string[]) => [...stockKeys.lists(), 'withRelations', stockIds] as const,
};

// 종목 + 관련 데이터 한번에 로드
export function useStocksWithRelations(stockIds: string[]) {
  return useQuery({
    queryKey: stockKeys.withRelations(stockIds),
    queryFn: async (): Promise<Stock[]> => {
      if (stockIds.length === 0) return [];

      const [stocksRes, pointsRes, segmentsRes, issuesRes] = await Promise.all([
        supabase.from('stocks').select('*').in('id', stockIds),
        supabase.from('investment_points').select('*').in('stock_id', stockIds).order('sort_order'),
        supabase.from('business_segments').select('*').in('stock_id', stockIds).order('sort_order'),
        supabase.from('issues').select('*').in('stock_id', stockIds).order('date', { ascending: false }),
      ]);

      if (stocksRes.error) throw stocksRes.error;

      // 투자포인트를 stock_id로 그룹
      const pointsByStock: Record<string, InvestmentPoint[]> = {};
      (pointsRes.data as DbInvestmentPointRow[] || []).forEach((p) => {
        if (!pointsByStock[p.stock_id]) pointsByStock[p.stock_id] = [];
        pointsByStock[p.stock_id].push({ title: p.title, description: p.description });
      });

      // 사업부문을 stock_id로 그룹
      const segmentsByStock: Record<string, BusinessSegment[]> = {};
      (segmentsRes.data as DbBusinessSegmentRow[] || []).forEach((s) => {
        if (!segmentsByStock[s.stock_id]) segmentsByStock[s.stock_id] = [];
        segmentsByStock[s.stock_id].push({
          id: s.id,
          name: s.name,
          nameKr: s.name_kr,
          value: s.value,
          iconUrl: s.icon_url ?? undefined,
        });
      });

      // 이슈를 stock_id로 그룹
      const issuesByStock: Record<string, StockIssue[]> = {};
      (issuesRes.data as DbIssueRow[] || []).forEach((issue) => {
        const imageUrls = issue.images || [];
        const mapped: StockIssue = {
          title: issue.title ?? undefined,
          content: issue.content,
          keywords: issue.keywords || [],
          date: issue.date,
          createdAt: issue.created_at ?? undefined,
          updatedAt: issue.updated_at ?? undefined,
          isCMS: issue.is_cms ?? undefined,
          images: imageUrls.map((img): IssueImage => ({
            url: typeof img === 'string' ? img : img.url,
            source: typeof img === 'string' ? '' : img.source || '',
            date: issue.date,
          })),
        };
        if (!issuesByStock[issue.stock_id]) issuesByStock[issue.stock_id] = [];
        issuesByStock[issue.stock_id].push(mapped);
      });

      // Stock 객체 조립
      return (stocksRes.data as DbStockRow[] || []).map((row): Stock => ({
        id: row.id,
        ticker: row.ticker,
        tickers: (row.tickers && row.tickers.length > 0) ? row.tickers : [row.ticker],  // 복수 티커 지원
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
        issues: issuesByStock[row.id] || [],
        businessSegments: segmentsByStock[row.id] || [],
        aiSummary: row.ai_summary || '',
        aiSummaryKeywords: row.ai_summary_keywords || [],
        lastUpdate: row.last_update ?? undefined,
        createdAt: row.created_at ?? undefined,
      }));
    },
    enabled: stockIds.length > 0,
  });
}

// 모든 종목 조회 (Admin용)
export function useAllStocks() {
  return useQuery({
    queryKey: stockKeys.lists(),
    queryFn: async (): Promise<Stock[]> => {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('name_kr');

      if (error) throw error;

      return (data as DbStockRow[] || []).map((row): Stock => ({
        id: row.id,
        ticker: row.ticker,
        tickers: (row.tickers && row.tickers.length > 0) ? row.tickers : [row.ticker],  // 복수 티커 지원
        name: row.name,
        nameKr: row.name_kr,
        sector: row.sector,
        keywords: row.keywords || [],
        investmentPoints: [],
        marketCap: row.market_cap ?? '',
        marketCapValue: row.market_cap_value || 0,
        price: 0,
        change: 0,
        returnRate: row.return_rate ?? undefined,
        per: row.per ?? undefined,
        pbr: row.pbr ?? undefined,
        psr: row.psr ?? undefined,
        description: row.description ?? '',
        issues: [],
        businessSegments: [],
        aiSummary: row.ai_summary || '',
        aiSummaryKeywords: row.ai_summary_keywords || [],
        lastUpdate: row.last_update ?? undefined,
        createdAt: row.created_at ?? undefined,
      }));
    },
  });
}

// Admin: 종목 수정
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stock: Partial<Stock> & { id: string }) => {
      const { data, error } = await getAdminSupabase()
        .from('stocks')
        .update({
          name: stock.name,
          name_kr: stock.nameKr,
          ticker: stock.tickers?.[0] || stock.ticker,  // 기본 티커는 첫 번째
          tickers: stock.tickers,  // 복수 티커 저장
          sector: stock.sector,
          description: stock.description,
          market_cap: stock.marketCap,
          market_cap_value: stock.marketCapValue,
          return_rate: stock.returnRate,
          per: stock.per,
          pbr: stock.pbr,
          psr: stock.psr,
          keywords: stock.keywords,
          ai_summary: stock.aiSummary,
          ai_summary_keywords: stock.aiSummaryKeywords,
          last_update: new Date().toISOString(),
        })
        .eq('id', stock.id)
        .select();

      if (error) throw error;
      if (!data?.length) throw new Error('권한이 없습니다.');
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}

// Admin: 종목 삭제
export function useDeleteStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stockId: string) => {
      const admin = getAdminSupabase();

      // 관련 데이터 삭제
      await admin.from('investment_points').delete().eq('stock_id', stockId);
      await admin.from('business_segments').delete().eq('stock_id', stockId);
      await admin.from('issues').delete().eq('stock_id', stockId);

      const { error } = await admin.from('stocks').delete().eq('id', stockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}
