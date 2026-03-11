import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { IBOpinion, DbIBOpinionRow } from '@/shared/types';

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

export function useIBOpinions() {
  return useQuery({
    queryKey: ['ibOpinions'],
    queryFn: async (): Promise<IBOpinion[]> => {
      const allData: DbIBOpinionRow[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('ib_opinions')
          .select('*')
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
  });
}

export interface IBStockGroup {
  ticker: string;
  stockName: string;
  sector: string;
  latestDate: string;
  latestOpinions: IBOpinion[];  // all opinions on the latest date
  allOpinions: IBOpinion[];     // all opinions for this ticker
}

export function useIBStockGroups() {
  const query = useIBOpinions();

  const groups: IBStockGroup[] = [];

  if (query.data) {
    const byTicker = new Map<string, IBOpinion[]>();

    for (const op of query.data) {
      const existing = byTicker.get(op.ticker) || [];
      existing.push(op);
      byTicker.set(op.ticker, existing);
    }

    for (const [ticker, opinions] of byTicker) {
      // Already sorted by date DESC from query
      const latestDate = opinions[0].date;
      const latestOpinions = opinions.filter((o) => o.date === latestDate);

      groups.push({
        ticker,
        stockName: opinions[0].stockName,
        sector: opinions[0].sector,
        latestDate,
        latestOpinions,
        allOpinions: opinions,
      });
    }

    // Sort groups alphabetically by ticker
    groups.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  return { ...query, groups };
}
