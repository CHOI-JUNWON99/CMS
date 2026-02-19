import React from 'react';
// 포트폴리오 요약 카드 컴포넌트 화면 첫 화면에 보이는 카드
interface SummaryCardProps {
  averageReturn: number;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  portfolioName: string;
  brandColor?: string | null;
}

/**
 * 스파크라인 SVG 컴포넌트
 *
 * === SVG Path 설명 ===
 *
 * viewBox="0 0 800 50" → 가로 800, 세로 50의 좌표계
 *   - X: 0(왼쪽) ~ 800(오른쪽)
 *   - Y: 0(위) ~ 50(아래) ← 주의: Y는 아래로 갈수록 커짐!
 *
 * Path 명령어:
 *   - M x y : 시작점으로 이동 (Move to)
 *   - L x y : 직선 그리기 (Line to)
 *   - Z : 경로 닫기 (시작점으로 돌아감)
 *
 * 예시: "M0 30 L100 20 L200 35 L300 25"
 *   → (0,30)에서 시작 → (100,20)으로 선 → (200,35)으로 선 → (300,25)으로 선
 *
 * === 라인 vs 채움 영역 ===
 *
 * 1. 라인: 그래프 선만 그림
 *    d="M0 30 L100 20 L200 35 ..."
 *
 * 2. 채움: 같은 경로 + 아래쪽을 닫아서 면적 생성
 *    d="M0 30 L100 20 L200 35 ... L800 25 L800 50 L0 50 Z"
 *                                    ↑        ↑      ↑
 *                               오른쪽끝  오른쪽  왼쪽   닫기
 *                               마지막점  하단    하단
 *
 * === 수정 팁 ===
 *
 * - Y값을 낮추면(예: 30→20) 선이 위로 올라감
 * - Y값을 높이면(예: 30→40) 선이 아래로 내려감
 * - X값 간격을 좁히면 더 촘촘한 그래프
 * - strokeWidth: 선 두께 (현재 2.5)
 * - stopOpacity: 채움 투명도 (0~1)
 */
/* Sparkline 컴포넌트 - 임시 주석처리
const Sparkline: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
  <svg
    className="w-full h-full"
    viewBox="0 0 800 80"
    preserveAspectRatio="none"
    fill="none"
  >
    <defs>
      <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={isDarkMode ? '#64748b' : '#94a3b8'} stopOpacity="0.2" />
        <stop offset="100%" stopColor={isDarkMode ? '#64748b' : '#94a3b8'} stopOpacity="0" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor={isDarkMode ? '#64748b' : '#94a3b8'} floodOpacity="0.2" />
      </filter>
    </defs>
    <path
      d="M0 64 L15 70 L25 75 L45 68 L55 78 L75 65 L95 72 L105 58 L125 67 L140 52 L160 62 L170 45 L190 55 L210 48 L230 58 L250 42 L265 52 L285 38 L310 48 L330 60 L345 50 L365 56 L385 44 L400 52 L420 38 L445 48 L460 35 L480 45 L510 30 L530 42 L550 28 L575 38 L600 25 L620 35 L650 48 L670 32 L690 40 L720 35 L745 45 L765 40 L785 30 L800 15 L800 80 L0 80 Z"
      fill="url(#sparklineGradient)"
    />
    <path
      d="M0 64 L15 70 L25 75 L45 68 L55 78 L75 65 L95 72 L105 58 L125 67 L140 52 L160 62 L170 45 L190 55 L210 48 L230 58 L250 42 L265 52 L285 38 L310 48 L330 60 L345 50 L365 56 L385 44 L400 52 L420 38 L445 48 L460 35 L480 45 L510 30 L530 42 L550 28 L575 38 L600 25 L620 35 L650 48 L670 32 L690 40 L720 35 L745 45 L765 40 L785 30 L800 15"
      stroke={isDarkMode ? '#94a3b8' : '#c7d2db'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      filter="url(#shadow)"
    />
  </svg>
);
*/

const SummaryCard: React.FC<SummaryCardProps> = ({ averageReturn, isDarkMode, isExpanded, onToggle, portfolioName, brandColor }) => {
  const isPositive = averageReturn >= 0;
  const effectiveBrandColor = brandColor || '#1e3a8a';

  return (
    <div className={`relative overflow-hidden transition-all duration-500 rounded-2xl ${
      isDarkMode
        ? 'bg-white/5 shadow-2xl shadow-black/50'
        : 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
    } ${isExpanded ? 'mb-4' : 'mb-6'}`}>

      {/* Sparkline - 배경으로 위치 (텍스트 뒤에) - 임시 주석처리 */}
      {/* <div className="absolute bottom-12 left-0 right-0 h-24 px-4 md:px-6">
        <Sparkline isDarkMode={isDarkMode} />
      </div> */}

      {/* Main Content */}
      <div className={`relative z-10 transition-all duration-500 ${isExpanded ? 'px-6 pt-5 pb-8 md:px-8 md:pt-6' : 'px-6 pt-6 pb-12 md:px-8 md:pt-8'}`}>

        {/* Header */}
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${
          isDarkMode ? 'text-slate-400' : 'text-slate-400'
        }`}>
          Portfolio Performance
        </span>

        {/* Content Row */}
        <div className="flex items-center justify-between mt-1">
          {/* Left Side: Portfolio Name */}
          <h2 className={`font-bold tracking-tight transition-all duration-500 ${
            isExpanded ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
          } ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {portfolioName || '포트폴리오 미설정'}
          </h2>

          {/* Right Side: Returns */}
          <span
            className={`transition-all duration-500 ${
              isExpanded ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
            } ${
              isPositive
                ? (isDarkMode ? 'text-rose-400' : 'text-[#FF0000]')
                : (isDarkMode ? 'text-blue-400' : 'text-blue-500')
            }`}
            style={{
              fontFamily: 'Gugi, sans-serif',
              fontWeight: 400,
              lineHeight: '90%',
              letterSpacing: '-0.02em'
            }}
          >
            {isPositive ? '+' : ''}{averageReturn.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 점선 구분선 - 전체 너비, 긴 대시 스타일 */}
      <div
        className="h-[1px] w-full"
        style={{
          backgroundImage: isDarkMode
            ? 'repeating-linear-gradient(to right, rgb(71 85 105 / 0.5) 0px, rgb(71 85 105 / 0.5) 8px, transparent 8px, transparent 14px)'
            : 'repeating-linear-gradient(to right, #d1d5db 0px, #d1d5db 8px, transparent 8px, transparent 14px)'
        }}
      />

      {/* Toggle Button Section */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-center gap-2 py-3.5 font-medium text-[13px] transition-all ${
          isDarkMode
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span>{isExpanded ? '포트폴리오 요약하기' : '포트폴리오 자세히 보기'}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bottom Color Bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: effectiveBrandColor }}
      />
    </div>
  );
};

export default SummaryCard;
