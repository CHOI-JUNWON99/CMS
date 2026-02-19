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
  const parts = capStr.split(' ');
  if (parts.length < 2) return null;
  const jo = parts[0].replace('조', '');
  const ok = parts[1].replace('억원', '').replace('억', '').replace(',', '');
  return { jo, ok };
}
