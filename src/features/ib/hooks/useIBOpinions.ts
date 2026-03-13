import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { IBOpinion, DbIBOpinionRow } from '@/shared/types';
import { useMemo } from 'react';

function mapRow(row: DbIBOpinionRow): IBOpinion {
  return {
    id: row.id,
    date: row.date,
    stockName: row.stock_name,
    ticker: row.ticker,
    sector: row.sector || '',
    ib: row.ib,
    opinion: row.opinion || '',
    prevPrice: row.prev_price || '',
    targetPrice: row.target_price || '',
    targetChange: row.target_change,
    currentPrice: row.current_price || '',
    upside: row.upside,
    eps: row.eps,
    comment: row.comment || '',
    analyst: row.analyst || '',
  };
}

const PAGE_SIZE = 200;

export function useIBOpinionsInfinite() {
  return useInfiniteQuery({
    queryKey: ['ibOpinionsInfinite'],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      let query = supabase
        .from('ib_opinions')
        .select('*')
        .order('date', { ascending: false })
        .order('ticker', { ascending: true })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('date', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as DbIBOpinionRow[];
      return rows.map(mapRow);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const lastDate = lastPage[lastPage.length - 1]?.date;
      return lastDate || undefined;
    },
  });
}

export interface IBDateGroup {
  date: string;
  opinions: IBOpinion[];
}

export function useIBDateGroups(query: ReturnType<typeof useIBOpinionsInfinite>) {
  return useMemo((): IBDateGroup[] => {
    const allOpinions = query.data?.pages.flat() || [];
    const byDate = new Map<string, IBOpinion[]>();

    for (const op of allOpinions) {
      const existing = byDate.get(op.date);
      if (existing) {
        existing.push(op);
      } else {
        byDate.set(op.date, [op]);
      }
    }

    return Array.from(byDate.entries()).map(([date, opinions]) => ({
      date,
      opinions,
    }));
  }, [query.data]);
}

export function useIBTickerOpinions(ticker: string) {
  return useQuery({
    queryKey: ['ibTickerOpinions', ticker],
    queryFn: async (): Promise<IBOpinion[]> => {
      const allData: DbIBOpinionRow[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('ib_opinions')
          .select('*')
          .eq('ticker', ticker)
          .order('date', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data) break;
        allData.push(...(data as DbIBOpinionRow[]));
        hasMore = data.length === pageSize;
        from += pageSize;
      }

      return allData.map(mapRow);
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  });
}
