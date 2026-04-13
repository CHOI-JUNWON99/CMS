import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_lib/supabase.js';
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  parseCookies,
  getRefreshExpiryMs,
} from '../_lib/tokens.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie || null);
  const oldRefreshToken = cookies['cms_refresh_token'];

  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const supabase = getServiceSupabase();
  const tokenHash = hashToken(oldRefreshToken);

  try {
    // DB에서 refresh token 조회
    const { data: tokenRow, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !tokenRow) {
      // 토큰이 존재하지 않음
      const clear = clearAuthCookies();
      clear.forEach(c => res.appendHeader('Set-Cookie', c));
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // 만료 확인
    if (new Date(tokenRow.expires_at) < new Date()) {
      const clear = clearAuthCookies();
      clear.forEach(c => res.appendHeader('Set-Cookie', c));
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // 재사용 감지: used === true이면 토큰 탈취 가능성
    if (tokenRow.used) {
      // 해당 family_id의 모든 토큰 무효화
      await supabase
        .from('refresh_tokens')
        .delete()
        .eq('family_id', tokenRow.family_id);

      const clear = clearAuthCookies();
      clear.forEach(c => res.appendHeader('Set-Cookie', c));
      return res.status(401).json({ error: 'Token reuse detected. All sessions invalidated.' });
    }

    // 현재 토큰을 used로 마킹
    await supabase
      .from('refresh_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id);

    // 새 토큰 발급
    const userType = tokenRow.user_type as 'user' | 'admin';
    let showPolicyNews = false;
    if (userType === 'user') {
      if (tokenRow.access_type === 'master') {
        showPolicyNews = true;
      } else if (tokenRow.access_type === 'shared') {
        const { data: spRow } = await supabase
          .from('shared_passwords')
          .select('show_policy_news')
          .eq('id', tokenRow.client_id)
          .maybeSingle();
        showPolicyNews = spRow?.show_policy_news ?? false;
      } else if (tokenRow.access_type === 'single') {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('show_policy_news')
          .eq('id', tokenRow.client_id)
          .maybeSingle();
        showPolicyNews = clientRow?.show_policy_news ?? false;
      }
    }

    const payload = {
      userType,
      accessType: tokenRow.access_type as 'single' | 'shared' | 'master' | undefined,
      clientId: tokenRow.client_id || undefined,
      clientIds: tokenRow.client_ids || [],
      clientName: tokenRow.client_name || undefined,
      brandColor: tokenRow.brand_color || undefined,
      logoUrl: tokenRow.logo_url || undefined,
      showPolicyNews,
    };

    const newAccessToken = await createAccessToken(payload);
    const newRefreshToken = generateRefreshToken();

    // 새 refresh token DB에 저장 (같은 family_id)
    await supabase.from('refresh_tokens').insert({
      token_hash: hashToken(newRefreshToken),
      family_id: tokenRow.family_id,
      user_type: userType,
      access_type: tokenRow.access_type,
      client_id: tokenRow.client_id,
      client_ids: tokenRow.client_ids,
      client_name: tokenRow.client_name,
      brand_color: tokenRow.brand_color,
      logo_url: tokenRow.logo_url,
      expires_at: new Date(Date.now() + getRefreshExpiryMs(userType)).toISOString(),
    });

    // 새 쿠키 설정
    const newCookies = setAuthCookies(newAccessToken, newRefreshToken, userType);
    newCookies.forEach(c => res.appendHeader('Set-Cookie', c));

    // UI 업데이트용 정보 반환
    return res.status(200).json({
      accessType: tokenRow.access_type,
      clientInfo: tokenRow.client_name ? {
        id: tokenRow.client_id,
        name: tokenRow.client_name,
        logo: tokenRow.logo_url || undefined,
        brandColor: tokenRow.brand_color || undefined,
      } : undefined,
      clientIds: tokenRow.client_ids || [],
      showPolicyNews,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
