import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, parseCookies } from '../_lib/tokens.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie || null);
  const accessToken = cookies['cms_access_token'];

  if (!accessToken) {
    return res.status(401).json({ error: 'No session' });
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  return res.status(200).json({
    userType: payload.userType,
    accessType: payload.accessType,
    clientInfo: payload.clientName ? {
      id: payload.clientId,
      name: payload.clientName,
      logo: payload.logoUrl,
      brandColor: payload.brandColor,
    } : undefined,
    clientIds: payload.clientIds || [],
    showPolicyNews: payload.showPolicyNews ?? false,
  });
}
