/**
 * 관리자 API 호출 헬퍼
 * httpOnly 쿠키로 인증하며, service role key를 사용하는 서버 엔드포인트를 호출합니다.
 */

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function adminFetch<T = unknown>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new AdminApiError(res.status, err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Stocks ---
export const adminStocksApi = {
  update: (id: string, updates: Record<string, unknown>) =>
    adminFetch<{ data: unknown }>('/api/admin/stocks', 'PUT', { id, ...updates }),

  create: (data: Record<string, unknown>) =>
    adminFetch<{ success: boolean }>('/api/admin/stocks', 'POST', data),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/stocks', 'DELETE', { id }),
};

// --- Business Segments ---
export const adminBusinessSegmentsApi = {
  create: (data: {
    stock_id: string;
    name: string;
    name_kr: string;
    value: number;
    icon_urls?: string[];
    sort_order: number;
  }) => adminFetch<{ success: boolean }>('/api/admin/business-segments', 'POST', data),

  update: (id: string, updates: Record<string, unknown>) =>
    adminFetch<{ success: boolean }>('/api/admin/business-segments', 'PUT', { id, ...updates }),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/business-segments', 'DELETE', { id }),
};

// --- Investment Points ---
export const adminInvestmentPointsApi = {
  create: (data: {
    stock_id: string;
    title: string;
    description: string;
    sort_order: number;
  }) => adminFetch<{ success: boolean }>('/api/admin/investment-points', 'POST', data),

  update: (id: string, updates: Record<string, unknown>) =>
    adminFetch<{ success: boolean }>('/api/admin/investment-points', 'PUT', { id, ...updates }),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/investment-points', 'DELETE', { id }),
};

// --- Issues ---
export const adminIssuesApi = {
  create: (data: {
    stock_id: string;
    title?: string | null;
    content: string;
    keywords: string[];
    date: string;
    is_cms: boolean;
    images?: string[];
  }) => adminFetch<{ success: boolean }>('/api/admin/issues', 'POST', data),

  update: (id: string, updates: Record<string, unknown>) =>
    adminFetch<{ success: boolean }>('/api/admin/issues', 'PUT', { id, ...updates }),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/issues', 'DELETE', { id }),
};

// --- Segment Icons ---
export const adminSegmentIconsApi = {
  create: (data: { name: string; icon_url: string }) =>
    adminFetch<{ data: { id: string; name: string; icon_url: string } }>('/api/admin/segment-icons', 'POST', data),

  update: (id: string, updates: Record<string, unknown>) =>
    adminFetch<{ success: boolean }>('/api/admin/segment-icons', 'PUT', { id, ...updates }),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/segment-icons', 'DELETE', { id }),
};

// --- Glossary ---
export const adminGlossaryApi = {
  create: (data: { term: string; definition: string }) =>
    adminFetch<{ success: boolean }>('/api/admin/glossary', 'POST', data),

  update: (id: string, term: string, definition: string) =>
    adminFetch<{ success: boolean }>('/api/admin/glossary', 'PUT', { id, term, definition }),

  delete: (id: string) =>
    adminFetch<{ success: boolean }>('/api/admin/glossary', 'DELETE', { id }),
};
