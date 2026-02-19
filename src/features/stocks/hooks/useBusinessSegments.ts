import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminSupabase } from '@/shared/lib/supabase';
import { stockKeys } from './useStocks';

// Admin: 사업부문 추가
export function useAddBusinessSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      stockId: string;
      name: string;
      nameKr: string;
      value: number;
      iconUrl?: string;
      sortOrder: number;
    }) => {
      const { error } = await getAdminSupabase()
        .from('business_segments')
        .insert({
          stock_id: data.stockId,
          name: data.name,
          name_kr: data.nameKr,
          value: data.value,
          icon_url: data.iconUrl || null,
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

// Admin: 사업부문 수정
export function useUpdateBusinessSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      stockId: string;
      name: string;
      nameKr: string;
      value: number;
      iconUrl?: string;
    }) => {
      const { error } = await getAdminSupabase()
        .from('business_segments')
        .update({
          name: data.name,
          name_kr: data.nameKr,
          value: data.value,
          icon_url: data.iconUrl || null,
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

// Admin: 사업부문 삭제
export function useDeleteBusinessSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; stockId: string }) => {
      const { error } = await getAdminSupabase()
        .from('business_segments')
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
