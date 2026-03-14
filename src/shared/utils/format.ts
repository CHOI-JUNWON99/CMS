/**
 * 시가총액 포맷팅 유틸리티
 *
 * 시가총액은 DB에 "1조 2,345억원" 형태로 저장됨
 */

/**
 * 시가총액을 짧은 형태로 포맷 (예: "1.2조")
 * 리스트, 테이블 등에서 사용
 */
export function formatMarketCapShort(capStr: string): string {
  if (!capStr) return '-';

  // 이미 한국어 포맷이면 그대로 반환
  if (/[조억만원]/.test(capStr)) return capStr;

  // 숫자 문자열이면 한국어 포맷으로 변환 (조 단위 추정)
  const num = parseFloat(capStr);
  if (!isNaN(num)) {
    return numberToKoreanMarketCap(num);
  }

  return capStr;
}

/**
 * 숫자(조 단위)를 한국어 시가총액 포맷으로 변환
 * 예: 33.12877 → "33조 1,288억원"
 *     0.75    → "7,500억원"
 */
export function numberToKoreanMarketCap(value: number): string {
  if (value >= 1) {
    const jo = Math.floor(value);
    const ok = Math.round((value - jo) * 10000);
    if (ok > 0) {
      return `${jo}조 ${ok.toLocaleString()}억원`;
    }
    return `${jo}조 0억원`;
  }
  // 1조 미만
  const ok = Math.round(value * 10000);
  return `${ok.toLocaleString()}억원`;
}

/**
 * 시가총액을 파싱하여 조/억 부분 반환
 * StockDetail 등 상세 뷰에서 스타일링된 렌더링에 사용
 */
export function parseMarketCap(capStr: string): { jo: string; ok: string } | null {
  if (!capStr) return null;

  // 숫자 문자열이면 한국어 포맷으로 변환 후 파싱
  let str = capStr;
  if (!/[조억만원]/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      str = numberToKoreanMarketCap(num);
    }
  }

  // 정규식으로 조/억 추출 (공백 유무 상관없이)
  const joMatch = str.match(/(\d+(?:,\d+)*)\s*조/);
  const okMatch = str.match(/조\s*(\d+(?:,\d+)*)\s*억/);

  if (!joMatch || !okMatch) return null;

  const jo = joMatch[1].replace(/,/g, '');
  const ok = okMatch[1].replace(/,/g, '');
  return { jo, ok };
}

/**
 * 시가총액 텍스트를 숫자(원 단위)로 변환
 * 정렬 및 DB 저장용
 *
 * 지원 형식:
 * - "33조 1,287억원" → 33128700000000
 * - "1,500억원" → 150000000000
 * - "50억원" → 5000000000
 * - "8,000만원" → 80000000
 */
export function parseMarketCapToValue(capStr: string): number {
  if (!capStr) return 0;

  let total = 0;

  // 조 단위 추출 (예: "33조" → 33)
  const joMatch = capStr.match(/(\d+(?:,\d+)*)\s*조/);
  if (joMatch) {
    const joValue = parseInt(joMatch[1].replace(/,/g, ''), 10);
    total += joValue * 1_0000_0000_0000; // 1조 = 10^12
  }

  // 억 단위 추출 (예: "1,287억" → 1287)
  const okMatch = capStr.match(/(\d+(?:,\d+)*)\s*억/);
  if (okMatch) {
    const okValue = parseInt(okMatch[1].replace(/,/g, ''), 10);
    total += okValue * 1_0000_0000; // 1억 = 10^8
  }

  // 만 단위 추출 (예: "8,000만" → 8000)
  const manMatch = capStr.match(/(\d+(?:,\d+)*)\s*만/);
  if (manMatch) {
    const manValue = parseInt(manMatch[1].replace(/,/g, ''), 10);
    total += manValue * 1_0000; // 1만 = 10^4
  }

  return total;
}
