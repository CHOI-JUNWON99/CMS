import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminInvestmentPointsApi } from '@/shared/lib/adminApi';
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
      await adminInvestmentPointsApi.create({
        stock_id: data.stockId,
        title: data.title,
        description: data.description,
        sort_order: data.sortOrder,
      });
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
      await adminInvestmentPointsApi.update(data.id, {
        title: data.title,
        description: data.description,
      });
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
      await adminInvestmentPointsApi.delete(data.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.detail(variables.stockId) });
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
    },
  });
}
