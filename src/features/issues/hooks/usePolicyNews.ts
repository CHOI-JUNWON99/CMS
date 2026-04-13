import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';
import { DbPolicyNewsRow, PolicyNews } from '@/shared/types';

export const policyNewsKeys = {
  all: ['policyNews'] as const,
  lists: () => [...policyNewsKeys.all, 'list'] as const,
  list: (showPolicyNews: boolean) => [...policyNewsKeys.lists(), showPolicyNews] as const,
  latest: (showPolicyNews: boolean) => [...policyNewsKeys.all, 'latest', showPolicyNews] as const,
};

function mapRow(row: DbPolicyNewsRow): PolicyNews {
  return {
    id: row.id,
    title: row.title ?? undefined,
    content: row.content,
    keywords: row.keywords || [],
    date: row.date,
    isCMS: row.is_cms ?? false,
    images: (row.images || []).map((img) => (typeof img === 'string' ? { url: img, source: '', date: '' } : img)),
    clientId: row.client_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function usePolicyNews() {
  const showPolicyNews = useAuthStore((state) => state.showPolicyNews);

  return useQuery({
    queryKey: policyNewsKeys.list(showPolicyNews),
    queryFn: async (): Promise<PolicyNews[]> => {
      if (!showPolicyNews) return [];

      const { data, error } = await supabase
        .from('policy_news')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as DbPolicyNewsRow[]).map(mapRow);
    },
    enabled: showPolicyNews,
  });
}

export function useLatestPolicyNews() {
  const showPolicyNews = useAuthStore((state) => state.showPolicyNews);

  return useQuery({
    queryKey: policyNewsKeys.latest(showPolicyNews),
    queryFn: async (): Promise<PolicyNews | null> => {
      if (!showPolicyNews) return null;

      const { data, error } = await supabase
        .from('policy_news')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      const rows = (data || []) as DbPolicyNewsRow[];
      return rows.length > 0 ? mapRow(rows[0]) : null;
    },
    enabled: showPolicyNews,
  });
}
