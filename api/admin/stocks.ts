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
      case 'PUT': {
        const { id, ...updates } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Stock ID required' });
        }

        const { data, error } = await supabase
          .from('stocks')
          .update(updates)
          .eq('id', id)
          .select();

        if (error) throw error;
        return res.status(200).json({ data: data?.[0] || null });
      }

      case 'POST': {
        const { error } = await supabase
          .from('stocks')
          .insert(req.body);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Stock ID required' });
        }

        // 관련 데이터 삭제
        await supabase.from('investment_points').delete().eq('stock_id', id);
        await supabase.from('business_segments').delete().eq('stock_id', id);

        const { data: issueIds } = await supabase
          .from('issues')
          .select('id')
          .eq('stock_id', id);
        if (issueIds) {
          for (const issue of issueIds) {
            await supabase.from('issue_images').delete().eq('issue_id', issue.id);
          }
        }
        await supabase.from('issues').delete().eq('stock_id', id);

        const { error } = await supabase.from('stocks').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Admin stocks error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
