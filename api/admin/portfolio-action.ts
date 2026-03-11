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

      // ===== 뉴스(이슈) 관리 =====
      case 'add_issue': {
        const { stockId, title, content, keywords, date, isCMS } = params;
        if (!stockId || !content) return res.status(400).json({ error: 'stockId and content required' });

        const { data: issueId, error } = await supabase
          .from('issues')
          .insert({
            stock_id: stockId,
            title: title || null,
            content,
            keywords: keywords || [],
            date: date || new Date().toISOString().slice(0, 10),
            is_cms: isCMS ?? false,
          })
          .select('id')
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, issueId: issueId?.id });
      }

      case 'update_issue': {
        const { issueId, title, content, keywords, date, isCMS, images } = params;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });

        const updates: Record<string, unknown> = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (keywords !== undefined) updates.keywords = keywords;
        if (date !== undefined) updates.date = date;
        if (isCMS !== undefined) updates.is_cms = isCMS;
        if (images !== undefined) updates.images = images;

        const { error } = await supabase.from('issues').update(updates).eq('id', issueId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'update_issue_images': {
        const { issueId, images } = params;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });

        const { error } = await supabase.from('issues').update({ images: images || [] }).eq('id', issueId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_issue': {
        const { issueId } = params;
        if (!issueId) return res.status(400).json({ error: 'issueId required' });

        const { error } = await supabase.from('issues').delete().eq('id', issueId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'bulk_insert_issues': {
        const { data: bulkData } = params;
        if (!bulkData || !Array.isArray(bulkData)) return res.status(400).json({ error: 'data array required' });

        const rows = bulkData.map((item: Record<string, unknown>) => ({
          stock_id: item.stock_id,
          title: item.title || null,
          content: item.content,
          keywords: item.keywords || [],
          date: item.date,
          is_cms: item.is_cms ?? false,
        }));

        const { data: inserted, error } = await supabase.from('issues').insert(rows).select('id');
        if (error) throw error;
        return res.status(200).json({ success: true, inserted: inserted?.length || 0 });
      }

      // ===== 용어사전 관리 =====
      case 'add_glossary_term': {
        const { term, definition } = params;
        if (!term || !definition) return res.status(400).json({ error: 'term and definition required' });

        const { error } = await supabase.from('glossary').insert({ term, definition });
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'update_glossary_term': {
        const { term, definition } = params;
        if (!term || !definition) return res.status(400).json({ error: 'term and definition required' });

        const { error } = await supabase.from('glossary').update({ definition }).eq('term', term);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_glossary_term': {
        const { term } = params;
        if (!term) return res.status(400).json({ error: 'term required' });

        const { error } = await supabase.from('glossary').delete().eq('term', term);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // ===== 자료실 관리 =====
      case 'add_resource': {
        const { id, title, description, fileType, category, date, fileSize, fileUrl, clientId } = params;
        if (!title) return res.status(400).json({ error: 'title required' });

        const { error } = await supabase.from('resources').insert({
          id: id || undefined,
          title,
          description: description || '',
          file_type: fileType,
          category: category || '기타',
          date: date || new Date().toISOString().slice(0, 10),
          file_size: fileSize || '',
          file_url: fileUrl || null,
          client_id: clientId || null,
        });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_resource': {
        const { resourceId } = params;
        if (!resourceId) return res.status(400).json({ error: 'resourceId required' });

        const { error } = await supabase.from('resources').delete().eq('id', resourceId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // ===== IB 투자의견 관리 =====
      case 'bulk_insert_ib_opinions': {
        const { data: bulkData } = params;
        if (!bulkData || !Array.isArray(bulkData)) return res.status(400).json({ error: 'data array required' });

        const rows = (bulkData as Record<string, unknown>[]).map((item) => ({
          date: item.date,
          stock_name: item.stock_name,
          ticker: item.ticker,
          sector: item.sector || null,
          ib: item.ib,
          opinion: item.opinion || null,
          prev_price: item.prev_price || null,
          target_price: item.target_price || null,
          target_change: item.target_change ?? null,
          current_price: item.current_price || null,
          upside: item.upside ?? null,
          eps: item.eps ?? null,
          comment: item.comment || null,
          analyst: item.analyst || null,
        }));

        const { data: inserted, error } = await supabase.from('ib_opinions').insert(rows).select('id');
        if (error) throw error;
        return res.status(200).json({ success: true, inserted: inserted?.length || 0 });
      }

      case 'delete_ib_opinion': {
        const { opinionId } = params;
        if (!opinionId) return res.status(400).json({ error: 'opinionId required' });

        const { error } = await supabase.from('ib_opinions').delete().eq('id', opinionId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_ib_opinions_by_date': {
        const { date } = params;
        if (!date) return res.status(400).json({ error: 'date required' });

        const { error } = await supabase.from('ib_opinions').delete().eq('date', date);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // ===== 종목 엑셀 벌크 업데이트 =====
      case 'bulk_update_stock_metrics': {
        const { data: bulkData } = params;
        if (!bulkData || !Array.isArray(bulkData)) return res.status(400).json({ error: 'data array required' });

        let updated = 0;
        let inserted = 0;

        for (const item of bulkData as Record<string, unknown>[]) {
          const ticker = item.ticker as string;
          if (!ticker) continue;

          // 기존 종목 확인
          const { data: existing } = await supabase
            .from('stocks')
            .select('id')
            .eq('ticker', ticker)
            .single();

          if (existing) {
            // 업데이트
            const updates: Record<string, unknown> = {};
            if (item.price !== undefined) updates.price = item.price;
            if (item.change !== undefined) updates.change = item.change;
            if (item.market_cap !== undefined) updates.market_cap = item.market_cap;
            if (item.return_rate !== undefined) updates.return_rate = item.return_rate;

            if (Object.keys(updates).length > 0) {
              const { error } = await supabase.from('stocks').update(updates).eq('id', existing.id);
              if (!error) updated++;
            }
          } else {
            // 신규 삽입
            const { error } = await supabase.from('stocks').insert({
              ticker,
              name: item.name || ticker,
              name_kr: item.name_kr || ticker,
              sector: item.sector || '',
              price: item.price || 0,
              change: item.change || 0,
              market_cap: item.market_cap || null,
              return_rate: item.return_rate || 0,
            });
            if (!error) inserted++;
          }
        }

        return res.status(200).json({ success: true, updated, inserted });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Admin action error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
