/**
 * 관리자 API 호출 헬퍼
 * 통합 엔드포인트 /api/admin/data를 통해 인증된 DB 작업을 수행합니다.
 */

export class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then(res => res.ok)
    .catch(() => false)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

interface AdminDataResponse {
  data?: unknown;
  success?: boolean;
  error?: string;
}

async function adminData<T = AdminDataResponse>(body: {
  action: string;
  table: string;
  id?: string;
  data?: unknown;
}): Promise<T> {
  let res = await fetch('/api/admin/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new AdminApiError(res.status, err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Stocks ---
export const adminStocksApi = {
  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ data: unknown }>({ action: 'update', table: 'stocks', id, data: updates }),

  create: (data: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'insert', table: 'stocks', data }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete-stock', table: 'stocks', id }),
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
  }) => adminData<{ success: boolean }>({ action: 'insert', table: 'business_segments', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'business_segments', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'business_segments', id }),
};

// --- Investment Points ---
export const adminInvestmentPointsApi = {
  create: (data: {
    stock_id: string;
    title: string;
    description: string;
    sort_order: number;
  }) => adminData<{ success: boolean }>({ action: 'insert', table: 'investment_points', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'investment_points', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'investment_points', id }),
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
  }) => adminData<{ success: boolean }>({ action: 'insert', table: 'issues', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'issues', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'issues', id }),
};

// --- Policy News ---
export const adminPolicyNewsApi = {
  create: (data: {
    title?: string | null;
    content: string;
    keywords: string[];
    date: string;
    is_cms: boolean;
    client_id?: string | null;
  }) => adminData<{ success: boolean }>({ action: 'insert', table: 'policy_news', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'policy_news', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'policy_news', id }),
};

// --- ETFs ---
export const adminEtfApi = {
  create: (data: Record<string, unknown>) =>
    adminData<{ data: unknown; success: boolean }>({ action: 'insert', table: 'etfs', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'etfs', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'etfs', id }),
};

// --- Segment Icons ---
export const adminSegmentIconsApi = {
  create: (data: { name: string; icon_url: string }) =>
    adminData<{ data: { id: string; name: string; icon_url: string }; success: boolean }>({ action: 'insert', table: 'segment_icons', data }),

  update: (id: string, updates: Record<string, unknown>) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'segment_icons', id, data: updates }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'segment_icons', id }),
};

// --- Glossary ---
export const adminGlossaryApi = {
  create: (data: { term: string; definition: string }) =>
    adminData<{ success: boolean }>({ action: 'insert', table: 'glossary', data }),

  update: (id: string, term: string, definition: string) =>
    adminData<{ success: boolean }>({ action: 'update', table: 'glossary', id, data: { term, definition } }),

  delete: (id: string) =>
    adminData<{ success: boolean }>({ action: 'delete', table: 'glossary', id }),
};

// --- Admin Action (portfolio-action 통합 엔드포인트) ---
export async function adminAction<T = { success: boolean }>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  let res = await fetch('/api/admin/portfolio-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action, ...params }),
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await fetch('/api/admin/portfolio-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...params }),
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new AdminApiError(res.status, err.error || `HTTP ${res.status}`);
  }

  return res.json();
}
