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

const SummaryCard: React.FC<SummaryCardProps> = ({ averageReturn, isDarkMode, isExpanded, onToggle, portfolioName, brandColor }) => {
  const isPositive = averageReturn >= 0;

  return (
    <div className={`relative overflow-hidden transition-all duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-[#0f1d32] to-[#162844] shadow-2xl shadow-black/50'
        : 'bg-gradient-to-br from-white to-slate-50 shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
    } ${isExpanded ? 'mb-4 rounded-xl' : 'mb-6 rounded-2xl'}`}>

      {/* Main Content */}
      <div className={`transition-all duration-500 ${isExpanded ? 'px-6 py-5 md:px-10 md:py-6' : 'px-8 py-8 md:px-12 md:py-10'}`}>

        {/* Header */}
        <span className={`text-[11px] font-semibold uppercase tracking-widest ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Portfolio Performance
        </span>

        {/* Content Row */}
        <div className="flex items-end justify-between mt-2">
          {/* Left Side: Portfolio Name */}
          <div className="flex flex-col">
            <h2 className={`font-bold tracking-tight transition-all duration-500 ${
              isExpanded ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
            } ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {portfolioName || '포트폴리오 미설정'}
            </h2>
            <span className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Managed by CMS Securities
            </span>
          </div>

          {/* Right Side: Returns */}
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}>
              누적 수익률
            </span>
            <div className={`flex items-baseline gap-1 px-4 py-2 rounded-xl transition-all duration-500 ${
              isPositive
                ? (isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50')
                : (isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50')
            }`}>
              <span className={`font-mono font-bold transition-all duration-500 ${
                isExpanded ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
              } ${
                isPositive
                  ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                  : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
              }`}>
                {isPositive ? '+' : ''}{averageReturn.toFixed(2)}
              </span>
              <span className={`font-mono font-bold ${isExpanded ? 'text-lg' : 'text-2xl'} ${
                isPositive
                  ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                  : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
              }`}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button Section */}
      <div className={`border-t transition-all duration-500 ${
        isDarkMode ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-100 bg-slate-50/80'
      }`}>
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-center gap-2 py-4 font-semibold text-[14px] transition-all ${
            isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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
      </div>

      {/* Bottom Color Bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: brandColor || '#1e3a8a' }}
      />
    </div>
  );
};

export default SummaryCard;
