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
  isCMS?: boolean;
  images?: IssueImage[];
}

export interface BusinessSegment {
  name: string;
  nameKr: string;
  value: number;
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

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'EXCEL' | 'WORD' | 'PPT';
  category: string;
  date: string;
  fileSize: string;
  fileUrl?: string;
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
  images?: IssueImage[];
}
