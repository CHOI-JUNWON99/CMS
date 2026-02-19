import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { stockKeys } from '@/features/stocks/hooks/useStocks';
import { DbIssueRow } from '@/shared/types';

// Query Keys
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  byStock: (stockId: string) => [...issueKeys.lists(), stockId] as const,
};

export interface IssueData {
  id: string;
  stockId: string;
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  isCMS: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// 종목별 이슈 조회
export function useIssuesByStock(stockId: string) {
  return useQuery({
    queryKey: issueKeys.byStock(stockId),
    queryFn: async (): Promise<IssueData[]> => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('stock_id', stockId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data as DbIssueRow[] || []).map((row): IssueData => ({
        id: row.id,
        stockId: row.stock_id,
        title: row.title ?? undefined,
        content: row.content,
        keywords: row.keywords || [],
        date: row.date,
        isCMS: row.is_cms ?? false,
        images: (row.images || []).map(img => typeof img === 'string' ? img : img.url),
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
      }));
    },
    enabled: !!stockId,
  });
}

// Admin: 이슈 추가
export function useAddIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      stockId: string;
      title?: string;
      content: string;
      keywords: string[];
      date: string;
      isCMS: boolean;
      images?: string[];
    }) => {
      const { error } = await getAdminSupabase()
        .from('issues')
        .insert({
          stock_id: data.stockId,
          title: data.title || null,
          content: data.content,
          keywords: data.keywords,
          date: data.date,
          is_cms: data.isCMS,
          images: data.images || [],
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byStock(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}

// Admin: 이슈 수정
export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      stockId: string;
      title?: string;
      content: string;
      keywords: string[];
      date: string;
      isCMS: boolean;
      images?: string[];
    }) => {
      const { error } = await getAdminSupabase()
        .from('issues')
        .update({
          title: data.title || null,
          content: data.content,
          keywords: data.keywords,
          date: data.date,
          is_cms: data.isCMS,
          images: data.images || [],
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byStock(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}

// Admin: 이슈 삭제
export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; stockId: string }) => {
      const { error } = await getAdminSupabase()
        .from('issues')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.byStock(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}
