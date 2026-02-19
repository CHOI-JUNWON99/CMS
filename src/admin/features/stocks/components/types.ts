export interface NewStockData {
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  description: string;
  marketCap: string;
  returnRate: number;
}

export interface UploadResult {
  updated: number;
  inserted: number;
  error?: string;
}
