import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAdminSupabase() {
  const adminCode = localStorage.getItem('cms_admin_code') || '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { 'x-admin-code': adminCode } },
  });
}
