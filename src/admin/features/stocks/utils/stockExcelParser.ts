export interface RawStockRow {
  ticker?: string;
  name?: string;
  name_kr?: string;
  sector?: string;
  marketCap?: string;
  totalReturn?: number;
  PER?: number;
  PBR?: number;
  PSR?: number;
  description?: string;
  keywords?: string;
}

export interface ParsedStockRow {
  ticker: string;
  name: string | null;
  name_kr: string | null;
  sector: string | null;
  market_cap: string | null;
  return_rate: number | null;
  per: number | null;
  pbr: number | null;
  psr: number | null;
  description: string | null;
  keywords: string[] | null;
}

/**
 * 티커에서 ID 추출
 * "002050.SZ" → "002050", "AAPL" → "AAPL"
 */
export function getIdFromTicker(ticker: string): string {
  if (!ticker) return '';
  const dotIndex = ticker.indexOf('.');
  return dotIndex > 0 ? ticker.substring(0, dotIndex) : ticker;
}

/**
 * 엑셀에서 읽은 행 배열을 파싱하여 유효한 종목 데이터 배열 반환
 * - ticker 없는 행 필터링
 * - 빈 값은 null로 처리
 * - keywords 쉼표 분리
 */
export function parseStockExcelRows(rows: RawStockRow[]): ParsedStockRow[] {
  return rows
    .filter((row) => row.ticker)
    .map((row) => ({
      ticker: row.ticker!,
      name: row.name || null,
      name_kr: row.name_kr || null,
      sector: row.sector || null,
      market_cap: row.marketCap || null,
      return_rate: row.totalReturn ?? null,
      per: row.PER ?? null,
      pbr: row.PBR ?? null,
      psr: row.PSR ?? null,
      description: row.description || null,
      keywords: row.keywords ? row.keywords.split(',').map((k) => k.trim()) : null,
    }));
}
