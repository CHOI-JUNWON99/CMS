import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminBusinessSegmentsApi } from '@/shared/lib/adminApi';
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
      iconUrls?: string[];
      sortOrder: number;
    }) => {
      await adminBusinessSegmentsApi.create({
        stock_id: data.stockId,
        name: data.name,
        name_kr: data.nameKr,
        value: data.value,
        icon_urls: data.iconUrls || [],
        sort_order: data.sortOrder,
      });
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
      iconUrls?: string[];
    }) => {
      await adminBusinessSegmentsApi.update(data.id, {
        name: data.name,
        name_kr: data.nameKr,
        value: data.value,
        icon_urls: data.iconUrls || [],
      });
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
      await adminBusinessSegmentsApi.delete(data.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}
