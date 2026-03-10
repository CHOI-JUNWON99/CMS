import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, parseCookies } from '../_lib/tokens.js';
import { getServiceSupabase } from '../_lib/supabase.js';

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const cookies = parseCookies(req.headers.cookie || null);
  const accessToken = cookies['cms_access_token'];
  if (!accessToken) return false;

  const payload = await verifyAccessToken(accessToken);
  return payload?.userType === 'admin';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getServiceSupabase();

  try {
    switch (req.method) {
      case 'POST': {
        const { stock_id, title, content, keywords, date, is_cms, images } = req.body || {};
        if (!stock_id) {
          return res.status(400).json({ error: 'stock_id required' });
        }

        const { error } = await supabase
          .from('issues')
          .insert({ stock_id, title: title || null, content, keywords, date, is_cms, images: images || [] });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'PUT': {
        const { id, ...updates } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Issue ID required' });
        }

        const { error } = await supabase
          .from('issues')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Issue ID required' });
        }

        const { error } = await supabase
          .from('issues')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Admin issues error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
