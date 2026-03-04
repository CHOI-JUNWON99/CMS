import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_lib/supabase';
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  getRefreshExpiryMs,
} from '../_lib/tokens';
import { randomUUID } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Admin code required' });
  }

  const supabase = getServiceSupabase();

  try {
    const { data, error } = await supabase.rpc('verify_admin_code', {
      input_code: code.trim(),
    });

    if (error) throw error;

    if (data !== true) {
      return res.status(401).json({ error: 'Invalid admin code' });
    }

    const payload = {
      userType: 'admin' as const,
    };

    const accessToken = await createAccessToken(payload);
    const refreshToken = generateRefreshToken();
    const familyId = randomUUID();

    await supabase.from('refresh_tokens').insert({
      token_hash: hashToken(refreshToken),
      family_id: familyId,
      user_type: 'admin',
      expires_at: new Date(Date.now() + getRefreshExpiryMs('admin')).toISOString(),
    });

    const cookies = setAuthCookies(accessToken, refreshToken, 'admin');
    cookies.forEach(cookie => res.appendHeader('Set-Cookie', cookie));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
