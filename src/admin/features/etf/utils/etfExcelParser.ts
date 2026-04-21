import * as XLSX from 'xlsx';

export interface EtfExcelRow {
  code: string;
  name_en: string;
  close_price_cny: number | null;
  minimum_purchase_unit: number | null;
  minimum_purchase_amount_krw: number | null;
  listing_date: string | null;
  aum_cny_million: number | null;
  aum_krw_billion: number | null;
  benchmark_name_en: string | null;
  category_large: string | null;
  category_small: string | null;
  ter: number | null;
  dividend_yield: number | null;
  avg_trading_value_ytd_billion: number | null;
  nav: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_1y: number | null;
  sector: string | null;
  volume: number | null;
  summary: string | null;
}

export interface EtfParseResult {
  rows: EtfExcelRow[];
  errors: { row: number; reason: string }[];
  duplicates: { row: number; firstRow: number; key: string }[];
}

const REQUIRED_HEADERS = [
  '코드',
  '명칭(영문)',
  '종가(위안)',
  '최소매수단위(주)',
  '최소매수금액(원)',
  '상장일',
  'AUM(CNY 백만 위안)',
  'AUM(KRW억원)',
  '벤치마크 명칭(영문)',
  '대분류',
  '소분류',
  'TER*',
  '배당률',
  '일평균 거래대금(YTD,억원)',
  'NAV',
  '1M(%)',
  '3M(%)',
  '6M(%)',
  '1Y(%)',
  '섹터',
  '거래량',
  'ETF개요',
] as const;

type CanonicalHeader = (typeof REQUIRED_HEADERS)[number];

const HEADER_ALIASES: Record<CanonicalHeader, string[]> = {
  '코드': ['코드'],
  '명칭(영문)': ['명칭(영문)'],
  '종가(위안)': ['종가(위안)'],
  '최소매수단위(주)': ['최소매수단위(주)'],
  '최소매수금액(원)': ['최소매수금액(원)'],
  '상장일': ['상장일'],
  'AUM(CNY 백만 위안)': ['AUM(CNY 백만 위안)', 'AUM(CNY백만위안)'],
  'AUM(KRW억원)': ['AUM(KRW억원)', 'AUM(KRW 억원)'],
  '벤치마크 명칭(영문)': ['벤치마크 명칭(영문)'],
  '대분류': ['대분류'],
  '소분류': ['소분류'],
  'TER*': ['TER*', 'TER'],
  '배당률': ['배당률'],
  '일평균 거래대금(YTD,억원)': ['일평균 거래대금(YTD,억원)', '일평균거래대금(YTD,억원)'],
  'NAV': ['NAV'],
  '1M(%)': ['1M(%)', '1M'],
  '3M(%)': ['3M(%)', '3M'],
  '6M(%)': ['6M(%)', '6M'],
  '1Y(%)': ['1Y(%)', '1Y'],
  '섹터': ['섹터'],
  '거래량': ['거래량'],
  'ETF개요': ['ETF개요', 'ETF 개요'],
};

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' || text === '-' ? null : text;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[＊]/g, '*');
}

function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return null;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function excelDateToISO(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;

  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

export function parseEtfExcel(file: ArrayBuffer): EtfParseResult {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const HEADER_ROW_INDEX = 1;
  const DATA_START_ROW_INDEX = 2;

  const parsedRows: EtfExcelRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const duplicates: { row: number; firstRow: number; key: string }[] = [];
  const seen = new Map<string, number>();

  if (rows.length === 0) {
    return { rows: parsedRows, errors: [{ row: 1, reason: '엑셀 시트가 비어 있습니다.' }], duplicates };
  }

  if (rows.length <= HEADER_ROW_INDEX) {
    return {
      rows: parsedRows,
      errors: [{ row: HEADER_ROW_INDEX + 1, reason: '헤더 행(2행)이 없습니다.' }],
      duplicates,
    };
  }

  const headerRow = rows[HEADER_ROW_INDEX] as unknown[];
  const headerMap = new Map<string, number>();
  headerRow.forEach((header, index) => {
    headerMap.set(normalizeHeader(header), index);
  });

  const resolvedIndex = {} as Record<CanonicalHeader, number>;
  const missingHeaders = REQUIRED_HEADERS.filter((header) => {
    const index = HEADER_ALIASES[header]
      .map((alias) => headerMap.get(normalizeHeader(alias)))
      .find((value) => value !== undefined);

    if (index === undefined) return true;
    resolvedIndex[header] = index;
    return false;
  });

  if (missingHeaders.length > 0) {
    return {
      rows: parsedRows,
      errors: [{ row: HEADER_ROW_INDEX + 1, reason: `헤더가 올바르지 않습니다: ${missingHeaders.join(', ')}` }],
      duplicates,
    };
  }

  for (let i = DATA_START_ROW_INDEX; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.every((cell) => cleanText(cell) === null)) continue;

    const code = cleanText(row[resolvedIndex['코드']]);
    const nameEn = cleanText(row[resolvedIndex['명칭(영문)']]);

    if (!code) {
      errors.push({ row: i + 1, reason: '코드가 비어 있습니다.' });
      continue;
    }
    if (!nameEn) {
      errors.push({ row: i + 1, reason: '명칭(영문)이 비어 있습니다.' });
      continue;
    }

    const duplicateKey = code.toUpperCase();
    const firstRow = seen.get(duplicateKey);
    if (firstRow !== undefined) {
      duplicates.push({ row: i + 1, firstRow, key: duplicateKey });
      continue;
    }
    seen.set(duplicateKey, i + 1);

    parsedRows.push({
      code,
      name_en: nameEn,
      close_price_cny: cleanNumber(row[resolvedIndex['종가(위안)']]),
      minimum_purchase_unit: cleanNumber(row[resolvedIndex['최소매수단위(주)']]),
      minimum_purchase_amount_krw: cleanNumber(row[resolvedIndex['최소매수금액(원)']]),
      listing_date: excelDateToISO(row[resolvedIndex['상장일']]),
      aum_cny_million: cleanNumber(row[resolvedIndex['AUM(CNY 백만 위안)']]),
      aum_krw_billion: cleanNumber(row[resolvedIndex['AUM(KRW억원)']]),
      benchmark_name_en: cleanText(row[resolvedIndex['벤치마크 명칭(영문)']]),
      category_large: cleanText(row[resolvedIndex['대분류']]),
      category_small: cleanText(row[resolvedIndex['소분류']]),
      ter: cleanNumber(row[resolvedIndex['TER*']]),
      dividend_yield: cleanNumber(row[resolvedIndex['배당률']]),
      avg_trading_value_ytd_billion: cleanNumber(row[resolvedIndex['일평균 거래대금(YTD,억원)']]),
      nav: cleanNumber(row[resolvedIndex['NAV']]),
      return_1m: cleanNumber(row[resolvedIndex['1M(%)']]),
      return_3m: cleanNumber(row[resolvedIndex['3M(%)']]),
      return_6m: cleanNumber(row[resolvedIndex['6M(%)']]),
      return_1y: cleanNumber(row[resolvedIndex['1Y(%)']]),
      sector: cleanText(row[resolvedIndex['섹터']]),
      volume: cleanNumber(row[resolvedIndex['거래량']]),
      summary: cleanText(row[resolvedIndex['ETF개요']]),
    });
  }

  return { rows: parsedRows, errors, duplicates };
}
