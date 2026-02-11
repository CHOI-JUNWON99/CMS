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
  lastUpdate?: string;
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
