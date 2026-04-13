import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';
import { DbEtfRow, ETF } from '@/shared/types';

export const etfKeys = {
  all: ['etfs'] as const,
  list: () => [...etfKeys.all, 'list'] as const,
};

function mapEtfRow(row: DbEtfRow): ETF {
  return {
    id: row.id,
    clientId: row.client_id,
    code: row.code,
    nameEn: row.name_en,
    closePriceCny: row.close_price_cny,
    minimumPurchaseUnit: row.minimum_purchase_unit,
    minimumPurchaseAmountKrw: row.minimum_purchase_amount_krw,
    listingDate: row.listing_date,
    aumCnyMillion: row.aum_cny_million,
    aumKrwBillion: row.aum_krw_billion,
    benchmarkNameEn: row.benchmark_name_en,
    categoryLarge: row.category_large,
    categorySmall: row.category_small,
    ter: row.ter,
    dividendYield: row.dividend_yield,
    avgTradingValueYtdBillion: row.avg_trading_value_ytd_billion,
    return1M: row.return_1m,
    return3M: row.return_3m,
    return6M: row.return_6m,
    return1Y: row.return_1y,
    sector: row.sector,
    volume: row.volume,
    summary: row.summary,
    isActive: row.is_active ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useEtfs() {
  const accessType = useAuthStore((state) => state.accessType);
  const clientInfo = useAuthStore((state) => state.clientInfo);
  const clientIds = useAuthStore((state) => state.clientIds);

  return useQuery({
    queryKey: [...etfKeys.list(), { accessType, clientId: clientInfo?.id, clientIds }],
    queryFn: async (): Promise<ETF[]> => {
      let query = supabase
        .from('etfs')
        .select('*')
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      if (accessType === 'single' && clientInfo?.id) {
        query = query.eq('client_id', clientInfo.id);
      } else if (accessType === 'shared' && clientIds.length > 0) {
        query = query.in('client_id', clientIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      return ((data || []) as DbEtfRow[]).map(mapEtfRow);
    },
    enabled: !!accessType,
  });
}
