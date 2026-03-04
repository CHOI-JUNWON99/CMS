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

// 공유 비밀번호 목록 조회
export function useSharedPasswords() {
  return useQuery({
    queryKey: sharedPasswordKeys.list(),
    queryFn: async (): Promise<SharedPassword[]> => {
      let rows: SharedPasswordRow[] = [];

      if (import.meta.env.PROD) {
        // 프로덕션: 서버 프록시 (httpOnly 쿠키 인증)
        const res = await fetch('/api/admin/shared-passwords', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch shared passwords');
        const json = await res.json();
        rows = json.data || [];
      } else {
        // 개발: Supabase RPC 직접 호출
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const { data, error } = await supabase.rpc('get_shared_passwords_admin', {
          admin_code: adminCode,
        });
        if (error) throw error;
        rows = (data as SharedPasswordRow[]) || [];
      }

      return rows.map((row): SharedPassword => ({
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/shared-passwords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: data.name.trim(),
            password: data.password.trim(),
            isMaster: data.isMaster,
            clientIds: data.clientIds,
            brandColor: data.brandColor || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
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
      }
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/shared-passwords', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: data.id,
            name: data.name.trim(),
            password: data.password.trim(),
            isMaster: data.isMaster,
            clientIds: data.clientIds,
            brandColor: data.brandColor || null,
            isActive: data.isActive ?? true,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
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
      }
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
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/shared-passwords', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const adminCode = useAdminAuthStore.getState().getAdminCode();
        const { error } = await supabase.rpc('delete_shared_password', {
          admin_code: adminCode,
          target_id: id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedPasswordKeys.all });
    },
  });
}
