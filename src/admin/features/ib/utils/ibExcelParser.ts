import * as XLSX from 'xlsx';

export interface IBExcelRow {
  date: string;
  stock_name: string;
  ticker: string;
  sector: string | null;
  ib: string;
  opinion: string | null;
  prev_price: string | null;
  target_price: string | null;
  target_change: number | null;
  current_price: string | null;
  upside: number | null;
  eps: number | null;
  comment: string | null;
  analyst: string | null;
}

export interface IBDuplicate {
  row: number;
  firstRow: number;
  key: string; // ticker | date | ib | analyst
}

export interface IBParseResult {
  rows: IBExcelRow[];
  errors: { row: number; reason: string }[];
  duplicates: IBDuplicate[];
}

function excelDateToISO(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;

  // Excel serial number
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  const str = String(value).trim();
  // Try parsing as date string
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

function cleanValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === '' || str === '-') return null;
  return str;
}

function cleanNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '-') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function parseIBExcel(file: ArrayBuffer): IBParseResult {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const rows: IBExcelRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const seen = new Map<string, number>(); // key → first row number
  const duplicates: IBDuplicate[] = [];

  // Row 0: title, Row 1&2: empty, Row 3: header, Row 4+: data
  const startRow = rawData.length > 4 ? 4 : 1;

  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i] as unknown[];
    if (!row || row.length === 0) continue;

    const date = excelDateToISO(row[0]);
    const stockName = cleanValue(row[1]);
    const ticker = cleanValue(row[2]);
    const ib = cleanValue(row[4]);

    if (!date) {
      if (stockName || ticker) {
        errors.push({ row: i + 1, reason: `날짜 파싱 실패: ${row[0]}` });
      }
      continue;
    }
    if (!stockName) { errors.push({ row: i + 1, reason: '종목명 없음' }); continue; }
    if (!ticker) { errors.push({ row: i + 1, reason: 'Ticker 없음' }); continue; }
    if (!ib) { errors.push({ row: i + 1, reason: 'IB 없음' }); continue; }

    // Duplicate check: ticker + date + ib + analyst
    const analyst = cleanValue(row[13]);
    const key = `${ticker}|${date}|${ib}|${analyst || ''}`;
    const firstRow = seen.get(key);
    if (firstRow !== undefined) {
      duplicates.push({ row: i + 1, firstRow, key });
      continue;
    }
    seen.set(key, i + 1);

    rows.push({
      date,
      stock_name: stockName,
      ticker,
      sector: cleanValue(row[3]),
      ib,
      opinion: cleanValue(row[5]),
      prev_price: cleanValue(row[6]),
      target_price: cleanValue(row[7]),
      target_change: cleanNumeric(row[8]),
      current_price: cleanValue(row[9]),
      upside: cleanNumeric(row[10]),
      eps: cleanNumeric(row[11]),
      comment: cleanValue(row[12]),
      analyst: cleanValue(row[13]),
    });
  }

  return { rows, errors, duplicates };
}
