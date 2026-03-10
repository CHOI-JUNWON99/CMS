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
        const { stock_id, title, description, sort_order } = req.body || {};
        if (!stock_id) {
          return res.status(400).json({ error: 'stock_id required' });
        }

        const { error } = await supabase
          .from('investment_points')
          .insert({ stock_id, title, description, sort_order });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'PUT': {
        const { id, ...updates } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Point ID required' });
        }

        const { error } = await supabase
          .from('investment_points')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Point ID required' });
        }

        const { error } = await supabase
          .from('investment_points')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Admin investment-points error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
