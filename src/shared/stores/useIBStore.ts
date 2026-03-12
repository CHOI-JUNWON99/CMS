import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import { DbIBOpinionRow } from '@/shared/types';

export type IBPeriod = '1m' | '3m' | '6m' | 'all';

interface IBState {
  activePeriod: IBPeriod;
  cache: Partial<Record<IBPeriod, DbIBOpinionRow[]>>;
  loadingPeriod: IBPeriod | null;

  setActivePeriod: (period: IBPeriod) => void;
  fetchPeriod: (period: IBPeriod) => Promise<void>;
  invalidateAndRefetch: () => Promise<void>;
  removeOpinion: (id: string) => void;
  removeByDate: (date: string) => void;
}

function getDateRange(period: IBPeriod): { from?: string } {
  if (period === 'all') return {};
  const now = new Date();
  const months = { '1m': 1, '3m': 3, '6m': 6 } as const;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months[period]);
  return { from: d.toISOString().slice(0, 10) };
}

async function fetchFromSupabase(period: IBPeriod): Promise<DbIBOpinionRow[]> {
  const range = getDateRange(period);
  const allData: DbIBOpinionRow[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('ib_opinions')
      .select('*')
      .order('date', { ascending: false });

    if (range.from) query = query.gte('date', range.from);

    query = query.range(from, from + pageSize - 1);

    const { data, error } = await query;
    if (error || !data) break;
    allData.push(...(data as DbIBOpinionRow[]));
    hasMore = data.length === pageSize;
    from += pageSize;
  }

  return allData;
}

export const useIBStore = create<IBState>((set, get) => ({
  activePeriod: '1m',
  cache: {},
  loadingPeriod: null,

  setActivePeriod: (period) => {
    set({ activePeriod: period });
    const { cache, fetchPeriod } = get();
    if (!cache[period]) {
      fetchPeriod(period);
    }
  },

  fetchPeriod: async (period) => {
    set({ loadingPeriod: period });
    const data = await fetchFromSupabase(period);
    set((state) => ({
      cache: { ...state.cache, [period]: data },
      loadingPeriod: null,
    }));
  },

  invalidateAndRefetch: async () => {
    const { activePeriod, fetchPeriod } = get();
    set({ cache: {} });
    await fetchPeriod(activePeriod);
  },

  removeOpinion: (id) => {
    set((state) => {
      const newCache = { ...state.cache };
      for (const key of Object.keys(newCache) as IBPeriod[]) {
        const arr = newCache[key];
        if (arr) {
          newCache[key] = arr.filter((o) => o.id !== id);
        }
      }
      return { cache: newCache };
    });
  },

  removeByDate: (date) => {
    set((state) => {
      const newCache = { ...state.cache };
      for (const key of Object.keys(newCache) as IBPeriod[]) {
        const arr = newCache[key];
        if (arr) {
          newCache[key] = arr.filter((o) => o.date !== date);
        }
      }
      return { cache: newCache };
    });
  },
}));
