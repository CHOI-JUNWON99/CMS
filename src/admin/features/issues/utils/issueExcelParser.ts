export interface RawIssueRow {
  ticker?: string;
  date?: string | number | Date;
  title?: string;
  content?: string;
  source?: string;
  is_cms?: boolean | string | number;
  keywords?: string;
}

export interface ParsedIssueRow {
  ticker: string;
  date: string;
  title: string;
  content: string;
  source: string;
  is_cms: boolean;
  keywords: string[];
}

/**
 * 엑셀 날짜 값을 "YY/MM/DD" 형식 문자열로 변환
 * - 문자열: 그대로 반환
 * - 숫자(Excel serial number): JS Date로 변환 후 포맷
 * - Date 객체: 포맷
 */
export function convertExcelDate(dateValue: unknown): string {
  if (typeof dateValue === 'string') {
    return dateValue;
  }
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    const yy = String(jsDate.getFullYear()).slice(-2);
    const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jsDate.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  }
  if (dateValue instanceof Date) {
    const yy = String(dateValue.getFullYear()).slice(-2);
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
    const dd = String(dateValue.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  }
  return String(dateValue);
}

/**
 * is_cms 값을 boolean으로 변환
 * true, 'TRUE', 1 → true / 나머지 → false
 */
export function parseIsCms(value: unknown): boolean {
  return value === true || value === 'TRUE' || value === 1;
}

/**
 * 엑셀에서 읽은 행 배열을 파싱하여 유효한 이슈 데이터 배열 반환
 * - 필수 필드(ticker, date, title, content)가 없는 행은 필터링
 * - 날짜 변환, is_cms 변환, keywords 파싱 수행
 */
export function parseIssueExcelRows(rows: RawIssueRow[]): ParsedIssueRow[] {
  return rows
    .filter((row) => row.ticker && row.date && row.title && row.content)
    .map((row) => ({
      ticker: row.ticker!,
      date: convertExcelDate(row.date),
      title: row.title!,
      content: row.content!,
      source: row.source || '',
      is_cms: parseIsCms(row.is_cms),
      keywords: row.keywords
        ? row.keywords
            .split(',')
            .map((k) => k.trim())
            .filter((k) => k)
        : [],
    }));
}
