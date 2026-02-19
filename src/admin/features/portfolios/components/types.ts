import { Client } from '@/shared/types';

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  clientId?: string | null;
  returnRate: number;
}

export interface StockItem {
  id: string;
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  marketCap: string;
  returnRate: number;
}

export interface PortfolioStock {
  stockId: string;
  addedAt: string;
}

export interface NewPortfolioData {
  name: string;
  description: string;
  clientId: string;
  returnRate: number;
}

export type { Client };
