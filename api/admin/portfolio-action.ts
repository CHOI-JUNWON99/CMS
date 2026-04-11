import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminWithRefresh } from '../_lib/tokens.js';
import { getServiceSupabase } from '../_lib/supabase.js';

function parseMarketCapToValue(capStr: string): number {
  if (!capStr) return 0;
  let total = 0;
  const joMatch = capStr.match(/(\d+(?:,\d+)*)\s*조/);
  if (joMatch) total += parseInt(joMatch[1].replace(/,/g, ''), 10) * 1_0000_0000_0000;
  const okMatch = capStr.match(/(\d+(?:,\d+)*)\s*억/);
  if (okMatch) total += parseInt(okMatch[1].replace(/,/g, ''), 10) * 1_0000_0000;
  const manMatch = capStr.match(/(\d+(?:,\d+)*)\s*만/);
  if (manMatch) total += parseInt(manMatch[1].replace(/,/g, ''), 10) * 1_0000;
  return total;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServiceSupabase();
  const isAdmin = await verifyAdminWithRefresh(req, res, supabase);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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

        const { data: result, error } = await supabase.rpc('bulk_insert_issues', {
          admin_code: process.env.ADMIN_CODE || '',
          data: bulkData,
        });
        if (error) throw error;
        return res.status(200).json({
          success: true,
          inserted: result?.inserted ?? 0,
          skipped: result?.skipped ?? [],
          duplicates: result?.duplicates ?? [],
          duplicate_count: result?.duplicate_count ?? 0,
          errors: result?.errors ?? [],
        });
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
        const { id, title, description, fileType, category, date, fileSize, fileUrl, clientId, originalFilename } = params;
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
          original_filename: originalFilename || null,
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

        const { data: result, error } = await supabase.rpc('bulk_insert_ib_opinions', {
          data: bulkData,
        });
        if (error) throw error;
        return res.status(200).json({
          success: true,
          inserted: result?.inserted ?? 0,
          duplicates: result?.duplicates ?? [],
          duplicate_count: result?.duplicate_count ?? 0,
          errors: result?.errors ?? [],
        });
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

      // ===== 정책 뉴스 관리 =====
      case 'add_policy_news': {
        const { title, content, keywords, date, isCMS, clientId } = params;
        if (!content) return res.status(400).json({ error: 'content required' });

        const { data: newsId, error } = await supabase
          .from('policy_news')
          .insert({
            title: title || null,
            content,
            keywords: keywords || [],
            date: date || new Date().toISOString().slice(0, 10),
            is_cms: isCMS ?? false,
            client_id: clientId || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, policyNewsId: newsId?.id });
      }

      case 'update_policy_news': {
        const { policyNewsId, title, content, keywords, date, isCMS, images, clientId } = params;
        if (!policyNewsId) return res.status(400).json({ error: 'policyNewsId required' });

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (keywords !== undefined) updates.keywords = keywords;
        if (date !== undefined) updates.date = date;
        if (isCMS !== undefined) updates.is_cms = isCMS;
        if (images !== undefined) updates.images = images;
        if (clientId !== undefined) updates.client_id = clientId;

        const { error } = await supabase.from('policy_news').update(updates).eq('id', policyNewsId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'update_policy_news_images': {
        const { policyNewsId, images } = params;
        if (!policyNewsId) return res.status(400).json({ error: 'policyNewsId required' });

        const { error } = await supabase.from('policy_news').update({ images: images || [], updated_at: new Date().toISOString() }).eq('id', policyNewsId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'delete_policy_news': {
        const { policyNewsId } = params;
        if (!policyNewsId) return res.status(400).json({ error: 'policyNewsId required' });

        const { error } = await supabase.from('policy_news').delete().eq('id', policyNewsId);
        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'bulk_insert_policy_news': {
        const { data: bulkData } = params;
        if (!bulkData || !Array.isArray(bulkData)) return res.status(400).json({ error: 'data array required' });

        let inserted = 0;
        const errors: Array<{ client_name: string; row: number; reason: string }> = [];
        const duplicates: string[] = [];

        for (let i = 0; i < bulkData.length; i++) {
          const item = bulkData[i] as Record<string, unknown>;
          try {
            // 중복 체크: client_id + date + title
            const { data: existing } = await supabase
              .from('policy_news')
              .select('id')
              .eq('client_id', item.client_id as string)
              .eq('date', item.date as string)
              .eq('title', item.title as string)
              .maybeSingle();

            if (existing) {
              duplicates.push(`${item.client_name || ''} / ${item.date} / ${item.title}`);
              continue;
            }

            const { error } = await supabase.from('policy_news').insert({
              title: item.title || null,
              content: item.content,
              keywords: item.keywords || [],
              date: item.date,
              is_cms: item.is_cms ?? false,
              client_id: item.client_id || null,
            });
            if (error) throw error;
            inserted++;
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            errors.push({ client_name: String(item.client_name || ''), row: i + 2, reason: message });
          }
        }

        return res.status(200).json({
          success: true,
          inserted,
          duplicates,
          duplicate_count: duplicates.length,
          errors,
        });
      }

      // ===== 종목 엑셀 벌크 업데이트 =====
      case 'bulk_update_stock_metrics': {
        const { data: bulkData } = params;
        if (!bulkData || !Array.isArray(bulkData)) return res.status(400).json({ error: 'data array required' });

        let updated = 0;
        let inserted = 0;
        const errors: string[] = [];

        // 엑셀에서 "#N/A", "-" 등 비정상 값을 안전하게 real로 변환
        const safeReal = (v: unknown): number | null => {
          if (v === undefined || v === null) return null;
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          return isNaN(n) ? null : n;
        };

        for (const item of bulkData as Record<string, unknown>[]) {
          const ticker = item.ticker as string;
          if (!ticker) continue;

          // ticker에서 id 추출 (예: "002050.SZ" → "002050")
          const dotIndex = ticker.indexOf('.');
          const stockId = dotIndex > 0 ? ticker.substring(0, dotIndex) : ticker;

          // 기존 종목 확인
          const { data: existing } = await supabase
            .from('stocks')
            .select('id')
            .eq('ticker', ticker)
            .single();

          if (existing) {
            // 업데이트
            const updates: Record<string, unknown> = {};
            if (item.market_cap !== undefined) {
              updates.market_cap = item.market_cap;
              updates.market_cap_value = parseMarketCapToValue(String(item.market_cap));
            }
            const rr = safeReal(item.return_rate); if (rr !== null) updates.return_rate = rr;
            const pe = safeReal(item.per); if (pe !== null) updates.per = pe;
            const pb = safeReal(item.pbr); if (pb !== null) updates.pbr = pb;
            const ps = safeReal(item.psr); if (ps !== null) updates.psr = ps;
            if (item.description !== undefined) updates.description = item.description;
            if (item.keywords !== undefined) updates.keywords = item.keywords;
            if (item.name !== undefined && item.name !== null) updates.name = item.name;
            if (item.name_kr !== undefined && item.name_kr !== null) updates.name_kr = item.name_kr;
            if (item.sector !== undefined) updates.sector = item.sector;

            if (Object.keys(updates).length > 0) {
              updates.last_update = new Date().toISOString();
              const { error } = await supabase.from('stocks').update(updates).eq('id', existing.id);
              if (!error) updated++;
              else errors.push(`Update failed for ${ticker}: ${error.message}`);
            }
          } else {
            // 신규 삽입 - id 필수
            const mcStr = item.market_cap ? String(item.market_cap) : null;
            const { error } = await supabase.from('stocks').insert({
              id: stockId,
              ticker,
              name: (item.name as string) || ticker,
              name_kr: (item.name_kr as string) || ticker,
              sector: (item.sector as string) || '',
              market_cap: mcStr,
              market_cap_value: mcStr ? parseMarketCapToValue(mcStr) : 0,
              return_rate: safeReal(item.return_rate) ?? 0,
              per: safeReal(item.per),
              pbr: safeReal(item.pbr),
              psr: safeReal(item.psr),
              description: item.description || null,
              keywords: item.keywords || null,
              last_update: new Date().toISOString(),
            });
            if (!error) inserted++;
            else errors.push(`Insert failed for ${ticker}: ${error.message}`);
          }
        }

        return res.status(200).json({ success: true, updated, inserted, errors: errors.length > 0 ? errors : undefined });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: unknown) {
    console.error('Admin action error:', err);
    const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as Record<string, unknown>).message) : String(err);
    return res.status(500).json({ error: message });
  }
}
