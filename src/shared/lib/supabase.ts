import { createClient } from '@supabase/supabase-js';
import { useAdminAuthStore } from '@/shared/stores/useAdminAuthStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Zustand store의 getState()를 사용하여 React 외부에서도 adminCode 접근 가능
export function getAdminSupabase() {
  const adminCode = useAdminAuthStore.getState().getAdminCode();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { 'x-admin-code': adminCode } },
  });
}
