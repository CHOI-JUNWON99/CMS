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

function formatDateParts(year: number, month: number, day: number): string {
  const yy = String(year).slice(-2);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

/**
 * 문자열 날짜를 "YY/MM/DD" 형식으로 정규화
 * - 26/4/9, 2026-04-09, 26.04.9 같은 값 지원
 * - 해석 불가능한 값은 trim 후 그대로 반환
 */
export function normalizeDateInput(dateValue: string): string {
  const trimmed = dateValue.trim();
  if (!trimmed) return trimmed;

  const matched = trimmed.match(/^(\d{2}|\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (!matched) return trimmed;

  const [, rawYear, rawMonth, rawDay] = matched;
  const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return trimmed;
  }

  return formatDateParts(year, month, day);
}

/**
 * 엑셀 날짜 값을 "YY/MM/DD" 형식 문자열로 변환
 * - 문자열: 그대로 반환
 * - 숫자(Excel serial number): JS Date로 변환 후 포맷
 * - Date 객체: 포맷
 */
export function convertExcelDate(dateValue: unknown): string {
  if (typeof dateValue === 'string') {
    return normalizeDateInput(dateValue);
  }
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return formatDateParts(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate());
  }
  if (dateValue instanceof Date) {
    return formatDateParts(dateValue.getFullYear(), dateValue.getMonth() + 1, dateValue.getDate());
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
