import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';
import { DbPortfolioStockRow } from '@/shared/types';

// Raw response type from Supabase (handles both single object and array cases)
type RawPortfolioRow = {
  id: string;
  name: string;
  return_rate: number | null;
  client_id: string | null;
  clients: { brand_color: string | null } | { brand_color: string | null }[] | null;
};

// Query Keys
export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  list: (filters: { accessType: string | null; clientId?: string; clientIds?: string[] }) =>
    [...portfolioKeys.lists(), filters] as const,
  detail: (id: string) => [...portfolioKeys.all, 'detail', id] as const,
};

// Types
export interface PortfolioData {
  id: string;
  name: string;
  returnRate: number;
  clientId: string;
  brandColor?: string;
}

// 포트폴리오 목록 조회
export function usePortfolios() {
  const accessType = useAuthStore((state) => state.accessType);
  const clientInfo = useAuthStore((state) => state.clientInfo);
  const clientIds = useAuthStore((state) => state.clientIds);

  return useQuery({
    queryKey: portfolioKeys.list({ accessType, clientId: clientInfo?.id, clientIds }),
    queryFn: async (): Promise<PortfolioData[]> => {
      let query = supabase
        .from('portfolios')
        .select('id, name, return_rate, client_id, clients(brand_color)')
        .eq('is_active', true);

      if (accessType === 'single' && clientInfo?.id) {
        query = query.eq('client_id', clientInfo.id);
      } else if (accessType === 'shared' && clientIds.length > 0) {
        query = query.in('client_id', clientIds);
      }
      // master: no filter

      const { data, error } = await query;
      if (error) throw error;

      return ((data || []) as RawPortfolioRow[]).map((p) => {
        // Handle both single object and array cases from Supabase join
        const clientData = Array.isArray(p.clients) ? p.clients[0] : p.clients;
        return {
          id: p.id,
          name: p.name,
          returnRate: p.return_rate || 0,
          clientId: p.client_id || '',
          brandColor: clientData?.brand_color ?? undefined,
        };
      });
    },
    enabled: !!accessType,
  });
}

// 포트폴리오 내 종목 ID 조회
export function usePortfolioStockIds(portfolioIds: string[]) {
  return useQuery({
    queryKey: ['portfolioStocks', portfolioIds],
    queryFn: async () => {
      if (portfolioIds.length === 0) return { stockIdsByPortfolio: {}, allStockIds: [] };

      const { data, error } = await supabase
        .from('portfolio_stocks')
        .select('portfolio_id, stock_id')
        .in('portfolio_id', portfolioIds);

      if (error) throw error;

      const stockIdsByPortfolio: Record<string, string[]> = {};
      const allStockIds: string[] = [];

      (data as DbPortfolioStockRow[] || []).forEach((ps) => {
        if (!stockIdsByPortfolio[ps.portfolio_id]) {
          stockIdsByPortfolio[ps.portfolio_id] = [];
        }
        stockIdsByPortfolio[ps.portfolio_id].push(ps.stock_id);
        if (!allStockIds.includes(ps.stock_id)) {
          allStockIds.push(ps.stock_id);
        }
      });

      return { stockIdsByPortfolio, allStockIds };
    },
    enabled: portfolioIds.length > 0,
  });
}

// 포트폴리오 조회수 기록
export function useRecordPortfolioView() {
  const accessType = useAuthStore((state) => state.accessType);
  const clientInfo = useAuthStore((state) => state.clientInfo);

  return useMutation({
    mutationFn: async (portfolioId: string) => {
      // 공유 비밀번호 접속 시 client_id를 null로 전달 (추적 불필요)
      const clientId = accessType === 'single' ? clientInfo?.id || null : null;

      const { error } = await supabase.rpc('record_portfolio_view', {
        p_portfolio_id: portfolioId,
        p_client_id: clientId,
      });
      if (error) throw error;
    },
    // 실패해도 무시 (UX에 영향 없음)
    onError: () => {},
  });
}
