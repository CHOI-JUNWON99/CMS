import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { SharedPassword, DbSharedPasswordRow } from '@/shared/types';

// Query Keys
export const sharedPasswordKeys = {
  all: ['sharedPasswords'] as const,
  list: () => [...sharedPasswordKeys.all, 'list'] as const,
};

// 공유 비밀번호 목록 조회
export function useSharedPasswords() {
  return useQuery({
    queryKey: sharedPasswordKeys.list(),
    queryFn: async (): Promise<SharedPassword[]> => {
      const { data, error } = await supabase
        .from('shared_passwords')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data as DbSharedPasswordRow[] || []).map((row): SharedPassword => ({
        id: row.id,
        name: row.name,
        password: row.password,
        isMaster: row.is_master,
        clientIds: row.client_ids || [],
        brandColor: row.brand_color ?? undefined,
        isActive: row.is_active,
      }));
    },
  });
}

// Admin: 공유 비밀번호 추가
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
      const { error } = await getAdminSupabase()
        .from('shared_passwords')
        .insert({
          name: data.name.trim(),
          password: data.password.trim(),
          is_master: data.isMaster,
          client_ids: data.clientIds,
          brand_color: data.brandColor || null,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}

// Admin: 공유 비밀번호 수정
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
      const { error } = await getAdminSupabase()
        .from('shared_passwords')
        .update({
          name: data.name.trim(),
          password: data.password.trim(),
          is_master: data.isMaster,
          client_ids: data.clientIds,
          brand_color: data.brandColor || null,
          is_active: data.isActive ?? true,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}

// Admin: 공유 비밀번호 삭제
export function useDeleteSharedPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getAdminSupabase()
        .from('shared_passwords')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}
