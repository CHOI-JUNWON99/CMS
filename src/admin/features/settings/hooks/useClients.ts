import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAdminAuthStore } from '@/shared/stores/useAdminAuthStore';
import { Client } from '@/shared/types';

// Query Keys
export const clientKeys = {
  all: ['clients'] as const,
  list: () => [...clientKeys.all, 'list'] as const,
};

interface ClientRow {
  id: string;
  name: string;
  code: string;
  description?: string;
  password?: string;
  logo_url?: string;
  brand_color?: string;
  is_active: boolean;
}

// 클라이언트(소속) 목록 조회
export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: async (): Promise<Client[]> => {
      let rows: ClientRow[] = [];

      if (import.meta.env.PROD) {
        // 프로덕션: 서버 프록시 (httpOnly 쿠키 인증)
        const res = await fetch('/api/admin/clients', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch clients');
        const json = await res.json();
        rows = json.data || [];
      } else {
        // 개발: Supabase RPC 직접 호출
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const { data, error } = await supabase.rpc('get_clients_admin', {
          admin_code: adminCode,
        });
        if (error) throw error;
        rows = (data as ClientRow[]) || [];
      }

      return rows.map((row): Client => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description ?? undefined,
        password: row.password ?? undefined,
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: client.name.trim(),
            password: client.password.trim(),
            brandColor: client.brandColor,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const code = client.name.trim().toLowerCase().replace(/\s+/g, '_');
        const { error } = await supabase.rpc('add_client_with_password', {
          admin_code: adminCode,
          client_name: client.name.trim(),
          client_code: code,
          client_password: client.password.trim(),
          client_brand_color: client.brandColor,
        });
        if (error) throw error;
      }
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: client.id,
            name: client.name.trim(),
            password: client.password.trim(),
            brandColor: client.brandColor,
            isActive: client.isActive ?? true,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const { error } = await supabase.rpc('update_client_password', {
          admin_code: adminCode,
          target_client_id: client.id,
          new_name: client.name.trim(),
          new_password: client.password.trim(),
          new_brand_color: client.brandColor,
          new_is_active: client.isActive ?? true,
        });
        if (error) throw error;
      }
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: clientId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const { error } = await supabase.rpc('delete_client', {
          admin_code: adminCode,
          target_client_id: clientId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
