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
  iconUrls?: string[];
}

export interface InvestmentPoint {
  id?: string;
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
  description?: string;
  password?: string;
  logoUrl?: string;
  brandColor?: string;  // 브랜드 색상 (헤더, 포트폴리오 카드 등)
  isActive: boolean;
}

export interface SharedPassword {
  id: string;
  name: string;
  password?: string;
  isMaster: boolean;  // true면 모든 소속 접근
  clientIds: string[];  // 선택적 공유 시 접근 가능한 소속 ID 목록
  brandColor?: string;
  isActive: boolean;
  showPolicyNews?: boolean;  // 정책 뉴스 표시 여부
}

export interface ETF {
  id: string;
  clientId?: string | null;
  code: string;
  nameEn: string;
  closePriceCny: number | null;
  minimumPurchaseUnit: number | null;
  minimumPurchaseAmountKrw: number | null;
  listingDate: string | null;
  aumCnyMillion: number | null;
  aumKrwBillion: number | null;
  benchmarkNameEn: string | null;
  categoryLarge: string | null;
  categorySmall: string | null;
  ter: number | null;
  dividendYield: number | null;
  avgTradingValueYtdBillion: number | null;
  nav: number | null;
  return1M: number | null;
  return3M: number | null;
  return6M: number | null;
  return1Y: number | null;
  sector: string | null;
  volume: number | null;
  summary: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  originalFilename?: string;
}

export type ViewMode = 'DASHBOARD' | 'DETAIL' | 'IB_DETAIL' | 'ETF_DETAIL';
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
// IB Opinions Types
// ==========================================

export interface IBOpinion {
  id: string;
  date: string;
  stockName: string;
  ticker: string;
  sector: string;
  ib: string;
  opinion: string;
  prevPrice: string;
  targetPrice: string;
  targetChange: number | null;
  currentPrice: string;
  upside: number | null;
  eps: number | null;
  comment: string;
  analyst: string;
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
  icon_urls: string[] | null;
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

export interface DbPolicyNewsRow {
  id: string;
  title: string | null;
  content: string;
  keywords: string[] | null;
  date: string;
  is_cms: boolean | null;
  images: IssueImage[] | null;
  client_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PolicyNews {
  id: string;
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  isCMS: boolean;
  images: IssueImage[];
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DbEtfRow {
  id: string;
  client_id: string | null;
  code: string;
  name_en: string;
  close_price_cny: number | null;
  minimum_purchase_unit: number | null;
  minimum_purchase_amount_krw: number | null;
  listing_date: string | null;
  aum_cny_million: number | null;
  aum_krw_billion: number | null;
  benchmark_name_en: string | null;
  category_large: string | null;
  category_small: string | null;
  ter: number | null;
  dividend_yield: number | null;
  avg_trading_value_ytd_billion: number | null;
  nav: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_1y: number | null;
  sector: string | null;
  volume: number | null;
  summary: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DbClientRow {
  id: string;
  name: string;
  code: string;
  password_hash: string | null;
  description: string | null;
  logo_url: string | null;
  brand_color: string | null;
  is_active: boolean;
}

export interface DbSharedPasswordRow {
  id: string;
  name: string;
  password_hash: string;
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
  original_filename: string | null;
}

export interface DbPortfolioRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  client_id: string | null;
}

export interface DbPortfolioStockRow {
  portfolio_id: string;
  stock_id: string;
  added_at: string;
}

export interface DbIBOpinionRow {
  id: string;
  date: string;
  stock_name: string;
  ticker: string;
  sector: string | null;
  ib: string;
  opinion: string | null;
  prev_price: string | null;
  target_price: string | null;
  target_change: number | null;
  current_price: string | null;
  upside: number | null;
  eps: number | null;
  comment: string | null;
  analyst: string | null;
  created_at: string;
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
