import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminSupabase } from '@/shared/lib/supabase';
import { stockKeys } from './useStocks';

// Admin: 투자포인트 추가
export function useAddInvestmentPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      stockId: string;
      title: string;
      description: string;
      sortOrder: number;
    }) => {
      const { error } = await getAdminSupabase()
        .from('investment_points')
        .insert({
          stock_id: data.stockId,
          title: data.title,
          description: data.description,
          sort_order: data.sortOrder,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}

// Admin: 투자포인트 수정
export function useUpdateInvestmentPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      stockId: string;
      title: string;
      description: string;
    }) => {
      const { error } = await getAdminSupabase()
        .from('investment_points')
        .update({
          title: data.title,
          description: data.description,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}

// Admin: 투자포인트 삭제
export function useDeleteInvestmentPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; stockId: string }) => {
      const { error } = await getAdminSupabase()
        .from('investment_points')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}
