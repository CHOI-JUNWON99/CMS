import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_lib/supabase';
import { clearAuthCookies, parseCookies, hashToken } from '../_lib/tokens';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie || null);
  const refreshToken = cookies['cms_refresh_token'];

  // DB에서 해당 토큰의 family 전체 삭제
  if (refreshToken) {
    const supabase = getServiceSupabase();
    const tokenHash = hashToken(refreshToken);

    const { data: tokenRow } = await supabase
      .from('refresh_tokens')
      .select('family_id')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenRow) {
      await supabase
        .from('refresh_tokens')
        .delete()
        .eq('family_id', tokenRow.family_id);
    }
  }

  // 쿠키 삭제
  const clear = clearAuthCookies();
  clear.forEach(c => res.appendHeader('Set-Cookie', c));

  return res.status(200).json({ success: true });
}
