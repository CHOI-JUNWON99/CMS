import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const ACCESS_SECRET = () => new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || '');

export interface TokenPayload {
  userType: 'user' | 'admin';
  accessType?: 'single' | 'shared' | 'master';
  clientId?: string;
  clientIds?: string[];
  clientName?: string;
  brandColor?: string;
  logoUrl?: string;
}

// Access Token 만료: 사용자 15분, 관리자 30분 (Sliding Session)
function getAccessExpiry(userType: 'user' | 'admin'): string {
  return userType === 'admin' ? '30m' : '15m';
}

// Refresh Token 만료: 사용자 7일, 관리자 4시간
export function getRefreshExpiryMs(userType: 'user' | 'admin'): number {
  return userType === 'admin' ? 4 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getAccessExpiry(payload.userType))
    .sign(ACCESS_SECRET());
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Cookie helper
export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  userType: 'user' | 'admin'
): string[] {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const refreshMaxAge = Math.floor(getRefreshExpiryMs(userType) / 1000);
  const accessMaxAge = userType === 'admin' ? 1800 : 900; // 30m or 15m in seconds

  return [
    `cms_access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=${accessMaxAge}`,
    `cms_refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/api${secure}; Max-Age=${refreshMaxAge}`,
  ];
}

export function clearAuthCookies(): string[] {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return [
    `cms_access_token=; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=0`,
    `cms_refresh_token=; HttpOnly; SameSite=Strict; Path=/api${secure}; Max-Age=0`,
  ];
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );
}

/**
 * Access token 검증 + 만료 시 refresh token으로 자동 갱신
 * 갱신 성공 시 응답에 새 쿠키를 설정합니다.
 */
export async function verifyAdminWithRefresh(
  req: { headers: { cookie?: string | null } },
  res: { appendHeader: (name: string, value: string) => void },
  supabase: SupabaseClient,
): Promise<boolean> {
  const cookies = parseCookies(req.headers.cookie || null);
  const accessToken = cookies['cms_access_token'];

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload?.userType === 'admin') return true;
  }

  const refreshToken = cookies['cms_refresh_token'];
  if (!refreshToken) return false;

  const tokenHash = hashToken(refreshToken);

  const { data: tokenRow, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !tokenRow) return false;
  if (new Date(tokenRow.expires_at) < new Date()) return false;
  if (tokenRow.used) return false;
  if (tokenRow.user_type !== 'admin') return false;

  await supabase
    .from('refresh_tokens')
    .update({ used: true })
    .eq('id', tokenRow.id);

  const payload: TokenPayload = {
    userType: 'admin',
    accessType: tokenRow.access_type,
    clientId: tokenRow.client_id || undefined,
    clientIds: tokenRow.client_ids || [],
    clientName: tokenRow.client_name || undefined,
    brandColor: tokenRow.brand_color || undefined,
    logoUrl: tokenRow.logo_url || undefined,
  };

  const newAccessToken = await createAccessToken(payload);
  const newRefreshToken = generateRefreshToken();

  await supabase.from('refresh_tokens').insert({
    token_hash: hashToken(newRefreshToken),
    family_id: tokenRow.family_id,
    user_type: 'admin',
    access_type: tokenRow.access_type,
    client_id: tokenRow.client_id,
    client_ids: tokenRow.client_ids,
    client_name: tokenRow.client_name,
    brand_color: tokenRow.brand_color,
    logo_url: tokenRow.logo_url,
    expires_at: new Date(Date.now() + getRefreshExpiryMs('admin')).toISOString(),
  });

  const newCookies = setAuthCookies(newAccessToken, newRefreshToken, 'admin');
  newCookies.forEach(c => res.appendHeader('Set-Cookie', c));

  return true;
}
