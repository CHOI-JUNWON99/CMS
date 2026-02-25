import { parseMarketCapToValue, formatMarketCapShort, parseMarketCap } from '../format';

describe('parseMarketCapToValue', () => {
  it('"33조 1,287억원" → 33128700000000', () => {
    expect(parseMarketCapToValue('33조 1,287억원')).toBe(33_1287_0000_0000);
  });

  it('"1,500억원" → 150000000000', () => {
    expect(parseMarketCapToValue('1,500억원')).toBe(1500_0000_0000);
  });

  it('"50억원" → 5000000000', () => {
    expect(parseMarketCapToValue('50억원')).toBe(50_0000_0000);
  });

  it('"8,000만원" → 80000000', () => {
    expect(parseMarketCapToValue('8,000만원')).toBe(8000_0000);
  });

  it('"" → 0', () => {
    expect(parseMarketCapToValue('')).toBe(0);
  });

  it('"5조" → 5000000000000 (억 없이 조만)', () => {
    expect(parseMarketCapToValue('5조')).toBe(5_0000_0000_0000);
  });
});

describe('formatMarketCapShort', () => {
  it('"33조 1,287억원" → "33.1조"', () => {
    expect(formatMarketCapShort('33조 1,287억원')).toBe('33.1조');
  });

  it('"" → "-"', () => {
    expect(formatMarketCapShort('')).toBe('-');
  });
});

describe('parseMarketCap', () => {
  it('"33조 1,287억원" → { jo: "33", ok: "1287" }', () => {
    expect(parseMarketCap('33조 1,287억원')).toEqual({ jo: '33', ok: '1287' });
  });

  it('"" → null', () => {
    expect(parseMarketCap('')).toBeNull();
  });
});
