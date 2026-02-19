/**
 * 섹터 간소화 유틸리티
 *
 * 다양한 섹터 문자열을 표준화된 카테고리로 변환합니다.
 * 4개 파일에서 중복 정의되어 있던 함수를 중앙화했습니다.
 *
 * @example
 * getSimplifiedSector('반도체 장비') // '반도체'
 * getSimplifiedSector('전기 통신 장비', true) // 'IT'
 */

type SectorMapping = {
  keywords: string[];
  long: string;
  short: string;
};

const SECTOR_MAPPINGS: SectorMapping[] = [
  {
    keywords: ['반도체'],
    long: '반도체',
    short: '반도체',
  },
  {
    keywords: ['자동차', '트럭'],
    long: '자동차',
    short: '자동차',
  },
  {
    keywords: ['기계', '장비', '자동화'],
    long: '산업재 / 자동화',
    short: '산업재',
  },
  {
    keywords: ['제약', '생명 공학'],
    long: '바이오',
    short: '바이오',
  },
  {
    keywords: ['온라인', '서비스'],
    long: '서비스 / 플랫폼',
    short: '서비스',
  },
  {
    keywords: ['전기', '통신', '인터넷', '장치'],
    long: 'IT / 인프라',
    short: 'IT',
  },
];

/**
 * 섹터 문자열을 간소화된 카테고리로 변환
 *
 * @param sector - 원본 섹터 문자열
 * @param useShortLabel - true면 짧은 라벨 반환 (기본: false)
 * @returns 간소화된 섹터 라벨
 */
export function getSimplifiedSector(sector: string, useShortLabel = false): string {
  for (const mapping of SECTOR_MAPPINGS) {
    if (mapping.keywords.some((keyword) => sector.includes(keyword))) {
      return useShortLabel ? mapping.short : mapping.long;
    }
  }
  return sector;
}

/**
 * 모든 간소화된 섹터 목록 반환
 *
 * @param useShortLabel - true면 짧은 라벨 반환
 * @returns 섹터 라벨 배열
 */
export function getAllSimplifiedSectors(useShortLabel = false): string[] {
  return SECTOR_MAPPINGS.map((m) => (useShortLabel ? m.short : m.long));
}
