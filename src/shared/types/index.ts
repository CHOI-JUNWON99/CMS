export interface IssueImage {
  url: string;
  caption?: string;
  source: string;
  date: string;
}

export interface StockIssue {
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  createdAt?: string;
  updatedAt?: string;
  isCMS?: boolean;
  images?: IssueImage[];
}

export interface BusinessSegment {
  id?: string;
  name: string;
  nameKr: string;
  value: number;
  iconUrl?: string;
}

export interface InvestmentPoint {
  title: string;
  description: string;
}

export interface Stock {
  id: string;
  ticker: string;
  tickers?: string[];  // 복수 티커 지원
  name: string;
  nameKr: string;
  sector: string;
  keywords: string[];
  investmentPoints: InvestmentPoint[];
  marketCap: string;
  marketCapValue: number;
  price: number;
  change: number;
  returnRate?: number;
  description: string;
  issues: StockIssue[];
  lastUpdate?: string;  // DB: last_update
  createdAt?: string;   // DB: created_at
  businessSegments?: BusinessSegment[];
  per?: number;
  pbr?: number;
  psr?: number;
  aiSummary?: string;
  aiSummaryKeywords?: string[];
}

export interface Client {
  id: string;
  name: string;
  code: string;
  password?: string;  // 소속별 비밀번호 (사용자 로그인용)
  description?: string;
  logoUrl?: string;
  brandColor?: string;  // 브랜드 색상 (헤더, 포트폴리오 카드 등)
  isActive: boolean;
}

export interface SharedPassword {
  id: string;
  name: string;
  password: string;
  isMaster: boolean;  // true면 모든 소속 접근
  clientIds: string[];  // 선택적 공유 시 접근 가능한 소속 ID 목록
  brandColor?: string;
  isActive: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'EXCEL' | 'WORD' | 'PPT';
  category: string;
  date: string;
  fileSize: string;
  fileUrl?: string;
  clientId?: string | null;
}

export type ViewMode = 'DASHBOARD' | 'DETAIL';
export type MainTab = 'PORTFOLIO' | 'ISSUES' | 'RESOURCES';

export type SortKey = 'name' | 'sector' | 'keywords' | 'marketCapValue' | 'returnRate';
export type SortDirection = 'ASC' | 'DESC';

export interface FeedItem {
  stockId: string;
  stockName: string;
  stockTicker: string;
  type: 'COMMENT' | 'ISSUE';
  isCMS: boolean;
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  createdAt?: string;
  updatedAt?: string;
  images?: IssueImage[];
}

// ==========================================
// Supabase Database Row Types
// ==========================================

export interface DbStockRow {
  id: string;
  ticker: string;
  tickers: string[] | null;  // 복수 티커 지원
  name: string;
  name_kr: string;
  sector: string;
  keywords: string[] | null;
  market_cap: string | null;
  market_cap_value: number | null;
  price: number | null;
  change: number | null;
  return_rate: number | null;
  description: string | null;
  last_update: string | null;
  created_at: string | null;
  per: number | null;
  pbr: number | null;
  psr: number | null;
  ai_summary: string | null;
  ai_summary_keywords: string[] | null;
}

export interface DbInvestmentPointRow {
  id: string;
  stock_id: string;
  title: string;
  description: string;
  order_index: number | null;
}

export interface DbBusinessSegmentRow {
  id: string;
  stock_id: string;
  name: string;
  name_kr: string;
  value: number;
  icon_url: string | null;
  sort_order: number | null;
}

export interface DbIssueRow {
  id: string;
  stock_id: string;
  title: string | null;
  content: string;
  keywords: string[] | null;
  date: string;
  is_cms: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  images: IssueImage[] | null;
}

export interface DbClientRow {
  id: string;
  name: string;
  code: string;
  password: string | null;
  description: string | null;
  logo_url: string | null;
  brand_color: string | null;
  is_active: boolean;
}

export interface DbSharedPasswordRow {
  id: string;
  name: string;
  password: string;
  is_master: boolean;
  client_ids: string[] | null;
  brand_color: string | null;
  is_active: boolean;
}

export interface DbResourceRow {
  id: string;
  title: string;
  description: string | null;
  file_type: 'PDF' | 'EXCEL' | 'WORD' | 'PPT';
  category: string | null;
  date: string;
  file_size: string | null;
  file_url: string | null;
  client_id: string | null;
}

export interface DbPortfolioRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  client_id: string | null;
  return_rate: number | null;
}

export interface DbPortfolioStockRow {
  portfolio_id: string;
  stock_id: string;
  added_at: string;
}

export interface DbAccessCodeRow {
  id: string;
  code: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface DbGlossaryRow {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  created_at: string | null;
}
