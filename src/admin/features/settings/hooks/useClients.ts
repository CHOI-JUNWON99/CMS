import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { Client } from '@/shared/types';

// Query Keys
export const clientKeys = {
  all: ['clients'] as const,
  list: () => [...clientKeys.all, 'list'] as const,
};

const DEFAULT_BRAND_COLOR = '#1e3a8a';
const DEFAULT_PORTFOLIO_TYPE = 'standard';

interface ClientRow {
  id: string;
  name: string;
  code: string;
  description?: string;
  password?: string;
  logo_url?: string;
  brand_color?: string;
  is_active: boolean;
  portfolio_type?: string | null;
}

interface LinkedPortfolioRow {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  portfolio_type: string | null;
}

interface SharedPasswordRow {
  id: string;
  client_ids: string[] | null;
}

interface ClientMutationInput {
  name: string;
  password: string;
  brandColor: string;
  description: string;
  portfolioType: string;
}

interface ClientUpdateInput extends ClientMutationInput {
  id: string;
  isActive?: boolean;
}

function normalizePortfolioType(value?: string | null) {
  return value === 'ib' ? 'ib' : DEFAULT_PORTFOLIO_TYPE;
}

function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? undefined,
    password: row.password ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    brandColor: row.brand_color ?? undefined,
    portfolioType: normalizePortfolioType(row.portfolio_type),
    isActive: row.is_active,
  };
}

async function fetchLinkedPortfolios(clientIds: string[]) {
  if (clientIds.length === 0) return [];

  const { data, error } = await supabase
    .from('portfolios')
    .select('id, name, description, client_id, portfolio_type')
    .in('client_id', clientIds);

  if (error) throw error;
  return (data as LinkedPortfolioRow[]) || [];
}

async function mergeClientsWithPortfolios(rows: ClientRow[]) {
  if (rows.length === 0) return rows;

  let portfolios = await fetchLinkedPortfolios(rows.map((row) => row.id));
  const portfolioMap = new Map<string, LinkedPortfolioRow[]>();

  portfolios.forEach((portfolio) => {
    if (!portfolio.client_id) return;
    const existing = portfolioMap.get(portfolio.client_id) || [];
    existing.push(portfolio);
    portfolioMap.set(portfolio.client_id, existing);
  });

  const missing = rows.filter((row) => !portfolioMap.get(row.id)?.length);
  const duplicates = rows.find((row) => (portfolioMap.get(row.id)?.length || 0) > 1);

  if (duplicates) {
    throw new Error(`"${duplicates.name}" 항목에 연결된 포트폴리오가 여러 개입니다. 1:1 구조로 정리 후 다시 시도해주세요.`);
  }

  if (missing.length > 0) {
    const { error } = await supabase
      .from('portfolios')
      .insert(
        missing.map((row) => ({
          name: row.name,
          description: row.description || '',
          is_active: false,
          client_id: row.id,
          portfolio_type: DEFAULT_PORTFOLIO_TYPE,
        })),
      );

    if (error) throw error;
    portfolios = await fetchLinkedPortfolios(rows.map((row) => row.id));
    portfolioMap.clear();
    portfolios.forEach((portfolio) => {
      if (!portfolio.client_id) return;
      const existing = portfolioMap.get(portfolio.client_id) || [];
      existing.push(portfolio);
      portfolioMap.set(portfolio.client_id, existing);
    });
  }

  return rows.map((row) => {
    const linked = portfolioMap.get(row.id)?.[0];
    return {
      ...row,
      description: linked?.description ?? row.description,
      portfolio_type: normalizePortfolioType(linked?.portfolio_type),
    };
  });
}

async function ensureSingleLinkedPortfolio(clientId: string, data: { name: string; description: string; portfolioType: string }) {
  const linked = await fetchLinkedPortfolios([clientId]);

  if (linked.length > 1) {
    throw new Error('연결된 포트폴리오가 여러 개입니다. 1:1 구조로 정리 후 다시 시도해주세요.');
  }

  const payload = {
    name: data.name.trim(),
    description: data.description.trim(),
    portfolio_type: normalizePortfolioType(data.portfolioType),
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

async function removeClientFromSharedPasswords(clientId: string) {
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

async function cleanupClientRelations(clientId: string) {
  const linked = await fetchLinkedPortfolios([clientId]);
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

  await removeClientFromSharedPasswords(clientId);
}

// 클라이언트(소속) 목록 조회
export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: async (): Promise<Client[]> => {
      let rows: ClientRow[] = [];

      if (import.meta.env.PROD) {
        // 프로덕션: 서버 프록시 (httpOnly 쿠키 인증)
        const res = await fetch('/api/admin/clients', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch clients');
        const json = await res.json();
        rows = json.data || [];
      } else {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, code, description, password, logo_url, brand_color, is_active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        rows = (data as ClientRow[]) || [];
        rows = await mergeClientsWithPortfolios(rows);
      }

      return rows.map(mapClientRow);
    },
  });
}

// Admin: 클라이언트 추가
export function useAddClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientMutationInput) => {
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: client.name.trim(),
            password: client.password.trim(),
            brandColor: client.brandColor,
            description: client.description.trim(),
            portfolioType: normalizePortfolioType(client.portfolioType),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const code = client.name.trim().toLowerCase().replace(/\s+/g, '_');
        const { data: passwordHash, error: hashError } = await supabase.rpc('hash_password', {
          plain_password: client.password.trim(),
        });
        if (hashError) throw hashError;

        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: client.name.trim(),
            code,
            description: client.description.trim(),
            password: client.password.trim(),
            password_hash: passwordHash,
            brand_color: client.brandColor || DEFAULT_BRAND_COLOR,
          })
          .select('id')
          .single();

        if (error) throw error;
        try {
          await ensureSingleLinkedPortfolio(data.id, client);
        } catch (portfolioError) {
          await supabase.from('clients').delete().eq('id', data.id);
          throw portfolioError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

// Admin: 클라이언트 수정
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: ClientUpdateInput) => {
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: client.id,
            name: client.name.trim(),
            password: client.password.trim(),
            brandColor: client.brandColor,
            description: client.description.trim(),
            portfolioType: normalizePortfolioType(client.portfolioType),
            isActive: client.isActive ?? true,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        const updates: Record<string, unknown> = {
          name: client.name.trim(),
          description: client.description.trim(),
          brand_color: client.brandColor,
          is_active: client.isActive ?? true,
        };

        if (client.password.trim()) {
          const { data: hash, error: hashError } = await supabase.rpc('hash_password', {
            plain_password: client.password.trim(),
          });
          if (hashError) throw hashError;
          updates.password = client.password.trim();
          updates.password_hash = hash;
        }

        const { error } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', client.id);

        if (error) throw error;
        await ensureSingleLinkedPortfolio(client.id, client);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

// Admin: 클라이언트 삭제
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (import.meta.env.PROD) {
        const res = await fetch('/api/admin/clients', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: clientId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error);
        }
      } else {
        await cleanupClientRelations(clientId);
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
