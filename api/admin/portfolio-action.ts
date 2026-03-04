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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getServiceSupabase();
  const { action, ...params } = req.body || {};

  try {
    switch (action) {
      case 'delete_portfolio': {
        const { portfolioId } = params;
        if (!portfolioId) return res.status(400).json({ error: 'portfolioId required' });

        await supabase.from('portfolio_stocks').delete().eq('portfolio_id', portfolioId);
        const { error } = await supabase.from('portfolios').delete().eq('id', portfolioId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'set_active_portfolio': {
        const { portfolioId } = params;
        if (!portfolioId) return res.status(400).json({ error: 'portfolioId required' });

        // 같은 client_id의 포트폴리오를 모두 비활성화 후 대상만 활성화
        const { data: target } = await supabase
          .from('portfolios')
          .select('client_id')
          .eq('id', portfolioId)
          .single();

        if (target?.client_id) {
          await supabase
            .from('portfolios')
            .update({ is_active: false })
            .eq('client_id', target.client_id);
        }

        const { error } = await supabase
          .from('portfolios')
          .update({ is_active: true })
          .eq('id', portfolioId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'deactivate_portfolio': {
        const { portfolioId } = params;
        if (!portfolioId) return res.status(400).json({ error: 'portfolioId required' });

        const { error } = await supabase
          .from('portfolios')
          .update({ is_active: false })
          .eq('id', portfolioId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'add_stock': {
        const { portfolioId, stockId } = params;
        if (!portfolioId || !stockId) return res.status(400).json({ error: 'portfolioId and stockId required' });

        const { error } = await supabase
          .from('portfolio_stocks')
          .insert({ portfolio_id: portfolioId, stock_id: stockId });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'remove_stock': {
        const { portfolioId, stockId } = params;
        if (!portfolioId || !stockId) return res.status(400).json({ error: 'portfolioId and stockId required' });

        const { error } = await supabase
          .from('portfolio_stocks')
          .delete()
          .eq('portfolio_id', portfolioId)
          .eq('stock_id', stockId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Admin portfolio action error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
