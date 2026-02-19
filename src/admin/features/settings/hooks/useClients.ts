import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { Client, DbClientRow } from '@/shared/types';

// Query Keys
export const clientKeys = {
  all: ['clients'] as const,
  list: () => [...clientKeys.all, 'list'] as const,
};

// 클라이언트(소속) 목록 조회
export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data as DbClientRow[] || []).map((row): Client => ({
        id: row.id,
        name: row.name,
        code: row.code,
        password: row.password ?? undefined,
        description: row.description ?? undefined,
        logoUrl: row.logo_url ?? undefined,
        brandColor: row.brand_color ?? undefined,
        isActive: row.is_active,
      }));
    },
  });
}

// Admin: 클라이언트 추가
export function useAddClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: { name: string; password: string; brandColor: string }) => {
      const code = client.name.trim().toLowerCase().replace(/\s+/g, '_');
      const { error } = await getAdminSupabase()
        .from('clients')
        .insert({
          name: client.name.trim(),
          code,
          password: client.password.trim(),
          brand_color: client.brandColor,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

// Admin: 클라이언트 수정
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: {
      id: string;
      name: string;
      password: string;
      brandColor: string;
      isActive?: boolean;
    }) => {
      const { error } = await getAdminSupabase()
        .from('clients')
        .update({
          name: client.name.trim(),
          password: client.password.trim(),
          brand_color: client.brandColor,
          is_active: client.isActive ?? true,
        })
        .eq('id', client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

// Admin: 클라이언트 삭제
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await getAdminSupabase()
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
