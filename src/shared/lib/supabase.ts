import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * @deprecated getAdminSupabase는 더 이상 사용하지 않습니다.
 * 서버 RPC 함수를 통해 관리자 작업을 수행하세요.
 * 마이그레이션 기간 동안 하위 호환용으로 유지합니다.
 */
export function getAdminSupabase() {
  return supabase;
}
