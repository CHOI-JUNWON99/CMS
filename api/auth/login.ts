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

    if (!data) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const result = data as {
      type: string;
      id: string;
      name: string;
      logo_url?: string;
      brand_color?: string;
      client_ids?: string[];
    };

    // Token payload
    const payload = {
      userType: 'user' as const,
      accessType: result.type as 'single' | 'shared' | 'master',
      clientId: result.id,
      clientIds: result.client_ids || [],
      clientName: result.name,
      brandColor: result.brand_color || undefined,
      logoUrl: result.logo_url || undefined,
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
      access_type: result.type,
      client_id: result.id,
      client_ids: result.client_ids || [],
      client_name: result.name,
      brand_color: result.brand_color || null,
      logo_url: result.logo_url || null,
      expires_at: new Date(Date.now() + getRefreshExpiryMs('user')).toISOString(),
    });

    // httpOnly 쿠키 설정
    const cookies = setAuthCookies(accessToken, refreshToken, 'user');
    cookies.forEach(cookie => res.appendHeader('Set-Cookie', cookie));

    // 비민감 사용자 정보 반환 (UI용)
    return res.status(200).json({
      accessType: result.type,
      clientInfo: {
        id: result.id,
        name: result.name,
        logo: result.logo_url || undefined,
        brandColor: result.brand_color || undefined,
      },
      clientIds: result.client_ids || [],
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
