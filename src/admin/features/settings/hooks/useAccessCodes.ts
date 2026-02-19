import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

// Query Keys
export const accessCodeKeys = {
  all: ['accessCodes'] as const,
  list: () => [...accessCodeKeys.all, 'list'] as const,
  adminList: () => [...accessCodeKeys.all, 'admin'] as const,
};

export interface AccessCode {
  id: string;
  code: string;
  isActive: boolean;
  isAdmin: boolean;
  expiresAt: string | null;
}

interface DbAccessCodeRpcRow {
  id: string;
  code: string;
  is_active: boolean;
  is_admin: boolean;
  expires_at: string | null;
}

// 모든 인증코드 목록 조회 (RPC 사용)
export function useAccessCodes() {
  return useQuery({
    queryKey: accessCodeKeys.list(),
    queryFn: async (): Promise<AccessCode[]> => {
      const { data, error } = await supabase.rpc('get_all_access_codes');
      if (error) throw error;

      return (data as DbAccessCodeRpcRow[] || []).map((row): AccessCode => ({
        id: row.id,
        code: row.code,
        isActive: row.is_active,
        isAdmin: row.is_admin,
        expiresAt: row.expires_at,
      }));
    },
  });
}

// 관리자 인증코드만 조회
export function useAdminAccessCodes() {
  const { data: allCodes, ...rest } = useAccessCodes();
  const adminCodes = allCodes?.filter(code => code.isAdmin) || [];
  return { data: adminCodes, ...rest };
}

// Admin: 관리자 코드 추가 (RPC 사용)
export function useAddAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; isAdmin?: boolean }) => {
      const { error } = await supabase.rpc('add_access_code', {
        input_code: data.code.trim(),
        input_is_admin: data.isAdmin ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessCodeKeys.all });
    },
  });
}

// Admin: 관리자 코드 삭제 (RPC 사용)
export function useDeleteAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_access_code', {
        input_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessCodeKeys.all });
    },
  });
}

// Admin: 코드 활성화/비활성화 토글 (RPC 사용)
export function useToggleAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('toggle_access_code', {
        input_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessCodeKeys.all });
    },
  });
}
