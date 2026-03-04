import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, createHash } from 'crypto';

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

// Access Token 만료: 사용자 30분, 관리자 60분
function getAccessExpiry(userType: 'user' | 'admin'): string {
  return userType === 'admin' ? '60m' : '30m';
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
  const accessMaxAge = userType === 'admin' ? 3600 : 1800; // 60m or 30m in seconds

  return [
    `cms_access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=${accessMaxAge}`,
    `cms_refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/api/auth${secure}; Max-Age=${refreshMaxAge}`,
  ];
}

export function clearAuthCookies(): string[] {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return [
    `cms_access_token=; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=0`,
    `cms_refresh_token=; HttpOnly; SameSite=Strict; Path=/api/auth${secure}; Max-Age=0`,
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
