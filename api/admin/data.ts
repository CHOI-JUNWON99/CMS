import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminWithRefresh } from '../_lib/tokens.js';
import { getServiceSupabase } from '../_lib/supabase.js';

/**
 * 통합 관리자 데이터 API
 * POST /api/admin/data
 * Body: { action, table, ...params }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServiceSupabase();
  const isAdmin = await verifyAdminWithRefresh(req, res, supabase);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, table, id, data: payload } = req.body || {};

  // 허용된 테이블만 접근 가능
  const allowedTables = ['stocks', 'business_segments', 'investment_points', 'issues', 'segment_icons', 'glossary'];
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: `Table not allowed: ${table}` });
  }

  try {
    switch (action) {
      case 'insert': {
        if (!payload) return res.status(400).json({ error: 'data required' });
        const { data: result, error } = await supabase.from(table).insert(payload).select();
        if (error) throw error;
        return res.status(200).json({ data: result?.[0] || null, success: true });
      }

      case 'update': {
        if (!id || !payload) return res.status(400).json({ error: 'id and data required' });
        const { data: result, error } = await supabase.from(table).update(payload).eq('id', id).select();
        if (error) throw error;
        return res.status(200).json({ data: result?.[0] || null, success: true });
      }

      case 'delete': {
        if (!id) return res.status(400).json({ error: 'id required' });
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete-stock': {
        // 종목 삭제: 관련 데이터 함께 삭제
        if (!id) return res.status(400).json({ error: 'id required' });
        await supabase.from('investment_points').delete().eq('stock_id', id);
        await supabase.from('business_segments').delete().eq('stock_id', id);
        const { data: issueIds } = await supabase.from('issues').select('id').eq('stock_id', id);
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
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Admin data error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
