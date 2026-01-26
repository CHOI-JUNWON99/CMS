
export interface StockIssue {
  title?: string;
  content: string;
  keywords: string[];
  date?: string;
}

export interface BusinessSegment {
  name: string;
  nameKr: string;
  value: number; // 1-100 scale for bubble size
  color?: string;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  keywords: string[];
  investmentPoints: string[]; // 메인 화면 및 상세 화면용 투자 포인트
  marketCap: string;
  marketCapValue: number;
  price: number;
  change: number;
  returnRate: number;
  description: string;
  cmsCommentTitle?: string;
  cmsComment?: string;
  cmsCommentKeywords?: string[];
  issues?: StockIssue[];
  lastUpdate?: string;
  rating?: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  businessSegments?: BusinessSegment[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'EXCEL' | 'WORD' | 'PPT';
  category: string;
  date: string;
  fileSize: string;
}

export type ViewMode = 'DASHBOARD' | 'DETAIL';
export type MainTab = 'PORTFOLIO' | 'ISSUES' | 'RESOURCES';

export type SortKey = 'name' | 'sector' | 'keywords' | 'marketCapValue' | 'change';
export type SortDirection = 'ASC' | 'DESC';

export interface FeedItem {
  stockId: string;
  stockName: string;
  stockTicker: string;
  type: 'COMMENT' | 'ISSUE';
  title?: string;
  content: string;
  keywords: string[];
  date: string;
}
