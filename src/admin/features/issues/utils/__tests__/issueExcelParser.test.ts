import { convertExcelDate, parseIsCms, parseIssueExcelRows } from '../issueExcelParser';

describe('convertExcelDate', () => {
  it('문자열 "25/01/15" → 그대로 반환', () => {
    expect(convertExcelDate('25/01/15')).toBe('25/01/15');
  });

  it('엑셀 시리얼 넘버 45672 → "25/01/15" 형태로 변환', () => {
    // 45672 = 2025-01-15 in Excel serial
    const result = convertExcelDate(45672);
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  });

  it('Date 객체 → "YY/MM/DD" 형태로 변환', () => {
    const date = new Date(2025, 0, 15); // 2025-01-15
    expect(convertExcelDate(date)).toBe('25/01/15');
  });

  it('숫자 0 경계값 처리', () => {
    const result = convertExcelDate(0);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  });

  it('숫자 1 경계값 처리', () => {
    const result = convertExcelDate(1);
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
  });

  it('undefined → 문자열로 변환', () => {
    expect(convertExcelDate(undefined)).toBe('undefined');
  });

  it('null → 문자열로 변환', () => {
    expect(convertExcelDate(null)).toBe('null');
  });
});

describe('parseIsCms', () => {
  it('true → true', () => {
    expect(parseIsCms(true)).toBe(true);
  });

  it("'TRUE' → true", () => {
    expect(parseIsCms('TRUE')).toBe(true);
  });

  it('1 → true', () => {
    expect(parseIsCms(1)).toBe(true);
  });

  it('false → false', () => {
    expect(parseIsCms(false)).toBe(false);
  });

  it("'FALSE' → false", () => {
    expect(parseIsCms('FALSE')).toBe(false);
  });

  it('0 → false', () => {
    expect(parseIsCms(0)).toBe(false);
  });

  it('undefined → false', () => {
    expect(parseIsCms(undefined)).toBe(false);
  });

  it("'true' (소문자) → false (현재 동작 기준)", () => {
    expect(parseIsCms('true')).toBe(false);
  });
});

describe('parseIssueExcelRows', () => {
  const validRow = {
    ticker: 'AAPL',
    date: '25/01/15',
    title: '테스트 제목',
    content: '테스트 내용',
    source: '출처',
    is_cms: true,
    keywords: 'AI, 클라우드, 반도체',
  };

  it('정상 데이터 → 올바르게 파싱', () => {
    const result = parseIssueExcelRows([validRow]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ticker: 'AAPL',
      date: '25/01/15',
      title: '테스트 제목',
      content: '테스트 내용',
      source: '출처',
      is_cms: true,
      keywords: ['AI', '클라우드', '반도체'],
    });
  });

  it('ticker 없는 행 → 필터링', () => {
    const row = { ...validRow, ticker: undefined };
    expect(parseIssueExcelRows([row])).toHaveLength(0);
  });

  it('date 없는 행 → 필터링', () => {
    const row = { ...validRow, date: undefined };
    expect(parseIssueExcelRows([row])).toHaveLength(0);
  });

  it('title 없는 행 → 필터링', () => {
    const row = { ...validRow, title: undefined };
    expect(parseIssueExcelRows([row])).toHaveLength(0);
  });

  it('content 없는 행 → 필터링', () => {
    const row = { ...validRow, content: undefined };
    expect(parseIssueExcelRows([row])).toHaveLength(0);
  });

  it('모든 행이 유효하지 않으면 → 빈 배열 반환', () => {
    const rows = [
      { ticker: undefined, date: '25/01/15', title: '제목', content: '내용' },
      { ticker: 'AAPL', date: undefined, title: '제목', content: '내용' },
    ];
    expect(parseIssueExcelRows(rows)).toHaveLength(0);
  });

  it('keywords "AI, 클라우드, 반도체" → ["AI", "클라우드", "반도체"]', () => {
    const result = parseIssueExcelRows([validRow]);
    expect(result[0].keywords).toEqual(['AI', '클라우드', '반도체']);
  });

  it('keywords 비어있으면 → []', () => {
    const row = { ...validRow, keywords: undefined };
    const result = parseIssueExcelRows([row]);
    expect(result[0].keywords).toEqual([]);
  });

  it("source 비어있으면 → '' (빈 문자열)", () => {
    const row = { ...validRow, source: undefined };
    const result = parseIssueExcelRows([row]);
    expect(result[0].source).toBe('');
  });
});
