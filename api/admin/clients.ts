import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminWithRefresh } from '../_lib/tokens.js';
import { getServiceSupabase } from '../_lib/supabase.js';

const DEFAULT_PORTFOLIO_TYPE = 'standard';

type ClientRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  password: string | null;
  logo_url: string | null;
  brand_color: string | null;
  is_active: boolean;
};

type PortfolioRow = {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  portfolio_type: string | null;
};

type SharedPasswordRow = {
  id: string;
  client_ids: string[] | null;
};

function normalizePortfolioType(value: unknown) {
  return value === 'ib' ? 'ib' : DEFAULT_PORTFOLIO_TYPE;
}

async function fetchLinkedPortfolios(supabase: ReturnType<typeof getServiceSupabase>, clientIds: string[]) {
  if (clientIds.length === 0) return [];

  const { data, error } = await supabase
    .from('portfolios')
    .select('id, name, description, client_id, portfolio_type')
    .in('client_id', clientIds);

  if (error) throw error;
  return (data as PortfolioRow[]) || [];
}

async function mergeClientsWithPortfolios(supabase: ReturnType<typeof getServiceSupabase>, rows: ClientRow[]) {
  if (rows.length === 0) return rows;

  let portfolios = await fetchLinkedPortfolios(supabase, rows.map((row) => row.id));
  const grouped = new Map<string, PortfolioRow[]>();

  portfolios.forEach((portfolio) => {
    if (!portfolio.client_id) return;
    const existing = grouped.get(portfolio.client_id) || [];
    existing.push(portfolio);
    grouped.set(portfolio.client_id, existing);
  });

  const duplicates = rows.find((row) => (grouped.get(row.id)?.length || 0) > 1);
  if (duplicates) {
    throw new Error(`"${duplicates.name}" 항목에 연결된 포트폴리오가 여러 개입니다. 1:1 구조로 정리 후 다시 시도해주세요.`);
  }

  const missing = rows.filter((row) => !grouped.get(row.id)?.length);
  if (missing.length > 0) {
    const { error } = await supabase.from('portfolios').insert(
      missing.map((row) => ({
        name: row.name,
        description: row.description || '',
        is_active: false,
        client_id: row.id,
        portfolio_type: DEFAULT_PORTFOLIO_TYPE,
      })),
    );
    if (error) throw error;

    portfolios = await fetchLinkedPortfolios(supabase, rows.map((row) => row.id));
    grouped.clear();
    portfolios.forEach((portfolio) => {
      if (!portfolio.client_id) return;
      const existing = grouped.get(portfolio.client_id) || [];
      existing.push(portfolio);
      grouped.set(portfolio.client_id, existing);
    });
  }

  return rows.map((row) => {
    const linked = grouped.get(row.id)?.[0];
    return {
      ...row,
      description: linked?.description ?? row.description,
      portfolio_type: normalizePortfolioType(linked?.portfolio_type),
    };
  });
}

async function ensureSingleLinkedPortfolio(
  supabase: ReturnType<typeof getServiceSupabase>,
  clientId: string,
  input: { name: string; description: string; portfolioType: string },
) {
  const linked = await fetchLinkedPortfolios(supabase, [clientId]);

  if (linked.length > 1) {
    throw new Error('연결된 포트폴리오가 여러 개입니다. 1:1 구조로 정리 후 다시 시도해주세요.');
  }

  const payload = {
    name: input.name.trim(),
    description: input.description.trim(),
    portfolio_type: normalizePortfolioType(input.portfolioType),
  };

  if (linked.length === 0) {
    const { error } = await supabase.from('portfolios').insert({
      ...payload,
      is_active: false,
      client_id: clientId,
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('portfolios')
    .update(payload)
    .eq('id', linked[0].id);

  if (error) throw error;
}

async function removeClientFromSharedPasswords(supabase: ReturnType<typeof getServiceSupabase>, clientId: string) {
  const { data, error } = await supabase
    .from('shared_passwords')
    .select('id, client_ids');

  if (error) throw error;

  const rows = (data as SharedPasswordRow[]) || [];
  for (const row of rows) {
    const clientIds = row.client_ids || [];
    if (!clientIds.includes(clientId)) continue;

    const { error: updateError } = await supabase
      .from('shared_passwords')
      .update({ client_ids: clientIds.filter((id) => id !== clientId) })
      .eq('id', row.id);

    if (updateError) throw updateError;
  }
}

async function cleanupClientRelations(supabase: ReturnType<typeof getServiceSupabase>, clientId: string) {
  const linked = await fetchLinkedPortfolios(supabase, [clientId]);
  const portfolioIds = linked.map((portfolio) => portfolio.id);

  if (portfolioIds.length > 0) {
    const { error: deleteViewsError } = await supabase.from('portfolio_views').delete().in('portfolio_id', portfolioIds);
    if (deleteViewsError) throw deleteViewsError;

    const { error: deleteStocksError } = await supabase.from('portfolio_stocks').delete().in('portfolio_id', portfolioIds);
    if (deleteStocksError) throw deleteStocksError;

    const { error: deletePortfoliosError } = await supabase.from('portfolios').delete().in('id', portfolioIds);
    if (deletePortfoliosError) throw deletePortfoliosError;
  }

  const { error: detachViewsError } = await supabase.from('portfolio_views').update({ client_id: null }).eq('client_id', clientId);
  if (detachViewsError) throw detachViewsError;

  const { error: detachResourcesError } = await supabase.from('resources').update({ client_id: null }).eq('client_id', clientId);
  if (detachResourcesError) throw detachResourcesError;

  const { error: detachPolicyNewsError } = await supabase.from('policy_news').update({ client_id: null }).eq('client_id', clientId);
  if (detachPolicyNewsError) throw detachPolicyNewsError;

  const { error: detachEtfsError } = await supabase.from('etfs').update({ client_id: null }).eq('client_id', clientId);
  if (detachEtfsError) throw detachEtfsError;
  await removeClientFromSharedPasswords(supabase, clientId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getServiceSupabase();
  const isAdmin = await verifyAdminWithRefresh(req, res, supabase);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, code, description, password, logo_url, brand_color, is_active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const merged = await mergeClientsWithPortfolios(supabase, (data as ClientRow[]) || []);
        return res.status(200).json({ data: merged });
      }

      case 'POST': {
        const { name, password, brandColor, description = '', portfolioType } = req.body || {};
        if (!name || !password) {
          return res.status(400).json({ error: 'Name and password required' });
        }

        const code = name.trim().toLowerCase().replace(/\s+/g, '_');
        const { data: passwordHash, error: hashError } = await supabase.rpc('hash_password', { plain_password: password.trim() });
        if (hashError) throw hashError;

        const { data: client, error } = await supabase
          .from('clients')
          .insert({
            name: name.trim(),
            code,
            description: String(description).trim(),
            password: password.trim(),
            password_hash: passwordHash,
            brand_color: brandColor || '#3B82F6',
          })
          .select('id')
          .single();

        if (error) throw error;
        try {
          await ensureSingleLinkedPortfolio(supabase, client.id, {
            name: name.trim(),
            description: String(description).trim(),
            portfolioType: normalizePortfolioType(portfolioType),
          });
        } catch (portfolioError) {
          await supabase.from('clients').delete().eq('id', client.id);
          throw portfolioError;
        }
        return res.status(200).json({ success: true });
      }

      case 'PUT': {
        const { id, name, password, brandColor, description = '', portfolioType, isActive } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Client ID required' });
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = String(description).trim();
        if (brandColor !== undefined) updates.brand_color = brandColor;
        if (isActive !== undefined) updates.is_active = isActive;
        if (password && password.trim()) {
          const { data: hash, error: hashError } = await supabase.rpc('hash_password', { plain_password: password.trim() });
          if (hashError) throw hashError;
          updates.password = password.trim();
          updates.password_hash = hash;
        }

        const { error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        await ensureSingleLinkedPortfolio(supabase, id, {
          name: name?.trim() || '',
          description: String(description).trim(),
          portfolioType: normalizePortfolioType(portfolioType),
        });
        return res.status(200).json({ success: true });
      }

      case 'DELETE': {
        const { id } = req.body || {};
        if (!id) {
          return res.status(400).json({ error: 'Client ID required' });
        }

        await cleanupClientRelations(supabase, id);
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Admin clients error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
