import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_lib/supabase.js';
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  getRefreshExpiryMs,
} from '../_lib/tokens.js';
import { randomUUID } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }

  const supabase = getServiceSupabase();

  try {
    // RPC를 통한 비밀번호 검증
    const { data, error } = await supabase.rpc('verify_client_password', {
      input_password: password.trim(),
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const typedResult = result as {
      type: string;
      id: string;
      name: string;
      logo_url?: string;
      brand_color?: string;
      client_ids?: string[];
    };

    // show_policy_news 플래그 조회
    let showPolicyNews = false;
    if (typedResult.type === 'master') {
      showPolicyNews = true;
    } else if (typedResult.type === 'shared') {
      // 공유 비밀번호의 show_policy_news 확인
      const { data: spRow } = await supabase
        .from('shared_passwords')
        .select('show_policy_news')
        .eq('id', typedResult.id)
        .single();
      showPolicyNews = spRow?.show_policy_news ?? false;
    } else if (typedResult.type === 'single') {
      // 소속(client)의 show_policy_news 확인
      const { data: clientRow } = await supabase
        .from('clients')
        .select('show_policy_news')
        .eq('id', typedResult.id)
        .single();
      showPolicyNews = clientRow?.show_policy_news ?? false;
    }

    // Token payload
    const payload = {
      userType: 'user' as const,
      accessType: typedResult.type as 'single' | 'shared' | 'master',
      clientId: typedResult.id,
      clientIds: typedResult.client_ids || [],
      clientName: typedResult.name,
      brandColor: typedResult.brand_color || undefined,
      logoUrl: typedResult.logo_url || undefined,
      showPolicyNews,
    };

    // Access Token 생성
    const accessToken = await createAccessToken(payload);

    // Refresh Token 생성 + DB 저장
    const refreshToken = generateRefreshToken();
    const familyId = randomUUID();

    await supabase.from('refresh_tokens').insert({
      token_hash: hashToken(refreshToken),
      family_id: familyId,
      user_type: 'user',
      access_type: typedResult.type,
      client_id: typedResult.id,
      client_ids: typedResult.client_ids || [],
      client_name: typedResult.name,
      brand_color: typedResult.brand_color || null,
      logo_url: typedResult.logo_url || null,
      expires_at: new Date(Date.now() + getRefreshExpiryMs('user')).toISOString(),
    });

    // httpOnly 쿠키 설정
    const cookies = setAuthCookies(accessToken, refreshToken, 'user');
    cookies.forEach(cookie => res.appendHeader('Set-Cookie', cookie));

    // 비민감 사용자 정보 반환 (UI용)
    return res.status(200).json({
      accessType: typedResult.type,
      clientInfo: {
        id: typedResult.id,
        name: typedResult.name,
        logo: typedResult.logo_url || undefined,
        brandColor: typedResult.brand_color || undefined,
      },
      clientIds: typedResult.client_ids || [],
      showPolicyNews,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
