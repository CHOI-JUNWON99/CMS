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
  const parts = capStr.split(' ');
  if (parts.length < 2) return capStr;
  const joPart = parts[0].replace('조', '');
  const okPart = parts[1].replace('억원', '').replace(',', '');
  const okFirstDigit = okPart.charAt(0) || '0';
  return `${joPart}.${okFirstDigit}조`;
}

/**
 * 시가총액을 파싱하여 조/억 부분 반환
 * StockDetail 등 상세 뷰에서 스타일링된 렌더링에 사용
 */
export function parseMarketCap(capStr: string): { jo: string; ok: string } | null {
  if (!capStr) return null;

  // 정규식으로 조/억 추출 (공백 유무 상관없이)
  const joMatch = capStr.match(/(\d+(?:,\d+)*)\s*조/);
  const okMatch = capStr.match(/조\s*(\d+(?:,\d+)*)\s*억/);

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
