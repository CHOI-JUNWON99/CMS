import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAdminAuthStore } from '@/shared/stores/useAdminAuthStore';
import { SharedPassword } from '@/shared/types';

// Query Keys
export const sharedPasswordKeys = {
  all: ['sharedPasswords'] as const,
  list: () => [...sharedPasswordKeys.all, 'list'] as const,
};

interface SharedPasswordRow {
  id: string;
  name: string;
  is_master: boolean;
  client_ids: string[] | null;
  brand_color: string | null;
  is_active: boolean;
}

// 공유 비밀번호 목록 조회 (RPC 경유, 비밀번호 미포함)
export function useSharedPasswords() {
  return useQuery({
    queryKey: sharedPasswordKeys.list(),
    queryFn: async (): Promise<SharedPassword[]> => {
      const adminCode = useAdminAuthStore.getState().getAdminCode();
      const { data, error } = await supabase.rpc('get_shared_passwords_admin', {
        admin_code: adminCode,
      });

      if (error) throw error;

      return ((data as SharedPasswordRow[]) || []).map((row): SharedPassword => ({
        id: row.id,
        name: row.name,
        isMaster: row.is_master,
        clientIds: row.client_ids || [],
        brandColor: row.brand_color ?? undefined,
        isActive: row.is_active,
      }));
    },
  });
}

// Admin: 공유 비밀번호 추가 (RPC 경유)
export function useAddSharedPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      password: string;
      isMaster: boolean;
      clientIds: string[];
      brandColor?: string;
    }) => {
      const adminCode = useAdminAuthStore.getState().getAdminCode();
      const { error } = await supabase.rpc('add_shared_password', {
        admin_code: adminCode,
        sp_name: data.name.trim(),
        sp_password: data.password.trim(),
        sp_is_master: data.isMaster,
        sp_client_ids: data.clientIds,
        sp_brand_color: data.brandColor || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}

// Admin: 공유 비밀번호 수정 (RPC 경유)
export function useUpdateSharedPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      password: string;
      isMaster: boolean;
      clientIds: string[];
      brandColor?: string;
      isActive?: boolean;
    }) => {
      const adminCode = useAdminAuthStore.getState().getAdminCode();
      const { error } = await supabase.rpc('update_shared_password', {
        admin_code: adminCode,
        target_id: data.id,
        new_name: data.name.trim(),
        new_password: data.password.trim(),
        new_is_master: data.isMaster,
        new_client_ids: data.clientIds,
        new_brand_color: data.brandColor || null,
        new_is_active: data.isActive ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}

// Admin: 공유 비밀번호 삭제 (RPC 경유)
export function useDeleteSharedPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const adminCode = useAdminAuthStore.getState().getAdminCode();
      const { error } = await supabase.rpc('delete_shared_password', {
        admin_code: adminCode,
        target_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}
