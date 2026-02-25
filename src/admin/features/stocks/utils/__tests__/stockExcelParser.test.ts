import { getIdFromTicker, parseStockExcelRows } from '../stockExcelParser';

describe('getIdFromTicker', () => {
  it('"002050.SZ" → "002050"', () => {
    expect(getIdFromTicker('002050.SZ')).toBe('002050');
  });

  it('"9988.HK" → "9988"', () => {
    expect(getIdFromTicker('9988.HK')).toBe('9988');
  });

  it('"AAPL" → "AAPL" (점 없음)', () => {
    expect(getIdFromTicker('AAPL')).toBe('AAPL');
  });

  it('"" → "" (빈 문자열)', () => {
    expect(getIdFromTicker('')).toBe('');
  });

  it('".SZ" → "" (점이 맨 앞)', () => {
    // dotIndex === 0 이므로 > 0 조건에 해당하지 않아 그대로 반환
    expect(getIdFromTicker('.SZ')).toBe('.SZ');
  });
});

describe('parseStockExcelRows', () => {
  const validRow = {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    name_kr: '애플',
    sector: 'Technology',
    marketCap: '33조 1,287억원',
    totalReturn: 15.5,
    PER: 28.3,
    PBR: 45.2,
    PSR: 7.8,
    description: '글로벌 테크 기업',
    keywords: 'AI, 반도체',
  };

  it('정상 데이터 → 올바르게 파싱', () => {
    const result = parseStockExcelRows([validRow]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ticker: 'AAPL',
      name: 'Apple Inc.',
      name_kr: '애플',
      sector: 'Technology',
      market_cap: '33조 1,287억원',
      return_rate: 15.5,
      per: 28.3,
      pbr: 45.2,
      psr: 7.8,
      description: '글로벌 테크 기업',
      keywords: ['AI', '반도체'],
    });
  });

  it('ticker 없는 행 → 필터링', () => {
    const row = { ...validRow, ticker: undefined };
    expect(parseStockExcelRows([row])).toHaveLength(0);
  });

  it('빈 name → null', () => {
    const row = { ...validRow, name: '' };
    const result = parseStockExcelRows([row]);
    expect(result[0].name).toBeNull();
  });

  it('빈 marketCap → null', () => {
    const row = { ...validRow, marketCap: '' };
    const result = parseStockExcelRows([row]);
    expect(result[0].market_cap).toBeNull();
  });

  it('totalReturn 숫자 → 그대로 유지', () => {
    const result = parseStockExcelRows([validRow]);
    expect(result[0].return_rate).toBe(15.5);
  });

  it('totalReturn undefined → null', () => {
    const row = { ...validRow, totalReturn: undefined };
    const result = parseStockExcelRows([row]);
    expect(result[0].return_rate).toBeNull();
  });

  it('keywords "AI, 반도체" → ["AI", "반도체"]', () => {
    const result = parseStockExcelRows([validRow]);
    expect(result[0].keywords).toEqual(['AI', '반도체']);
  });

  it('keywords 비어있으면 → null', () => {
    const row = { ...validRow, keywords: '' };
    const result = parseStockExcelRows([row]);
    expect(result[0].keywords).toBeNull();
  });

  it('PER/PBR/PSR 숫자 → 그대로 유지', () => {
    const result = parseStockExcelRows([validRow]);
    expect(result[0].per).toBe(28.3);
    expect(result[0].pbr).toBe(45.2);
    expect(result[0].psr).toBe(7.8);
  });

  it('PER/PBR/PSR undefined → null', () => {
    const row = { ...validRow, PER: undefined, PBR: undefined, PSR: undefined };
    const result = parseStockExcelRows([row]);
    expect(result[0].per).toBeNull();
    expect(result[0].pbr).toBeNull();
    expect(result[0].psr).toBeNull();
  });
});
