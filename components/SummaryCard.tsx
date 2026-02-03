import React from 'react';
// 포트폴리오 요약 카드 컴포넌트 화면 첫 화면에 보이는 카드
interface SummaryCardProps {
  averageReturn: number;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  portfolioName: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ averageReturn, isDarkMode, isExpanded, onToggle, portfolioName }) => {
  const isPositive = averageReturn >= 0;

  return (
    <div className={`relative rounded-[2rem] border transition-all duration-[800ms] cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden ${
      isDarkMode 
        ? 'bg-[#112240] border-slate-600 shadow-2xl shadow-black/40' 
        : 'bg-white border-gray-200 shadow-lg'
    } ${isExpanded ? 'px-6 py-2 md:px-10 md:py-3 mb-4' : 'px-8 py-5 md:px-12 md:py-8 mb-6'}`}>
      
      {/* VIP Badge */}
      <div className={`absolute top-4 right-8 z-20 px-1.5 py-0.5 rounded-sm text-[8px] font-black tracking-[0.2em] transition-all duration-[800ms] ${
        isDarkMode
          ? 'bg-primary-light/10 text-primary-accent border border-primary-light/20'
          : 'bg-primary text-white shadow-sm'
      } ${isExpanded ? 'opacity-20 translate-x-4 scale-75' : 'opacity-100'}`}>
        VIP
      </div>

      {/* Background Decorative Element */}
      <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none transition-transform duration-[1200ms] ease-out ${
        isExpanded ? 'translate-x-32 -translate-y-32 scale-50' : 'translate-x-10 -translate-y-10'
      }`}>
        <div className="w-full h-full bg-primary rounded-full blur-[100px]" />
      </div>

      {/* Morphing Content Container */}
      <div className={`flex flex-col items-center w-full transition-all duration-[800ms] ${isExpanded ? 'md:flex-row' : 'gap-4'}`}>
        
        {/* Left Side: Titles */}
        <div className={`flex flex-col transition-all duration-[800ms] transform ease-in-out ${
          isExpanded ? 'md:items-start text-left scale-90' : 'items-center text-center scale-100'
        }`}>
          <h2 className={`text-[11px] font-black mb-0.5 uppercase tracking-[0.3em] transition-all ${
            isDarkMode ? 'text-primary-accent' : 'text-primary'
          }`}>
            Portfolio Performance
          </h2>
          <p className={`font-black tracking-tighter transition-all duration-[800ms] ${
            isExpanded ? 'text-lg md:text-xl' : 'text-xl md:text-3xl'
          } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {portfolioName || '포트폴리오 미설정'}
          </p>
          <p className={`font-bold transition-all duration-[800ms] opacity-60 ${
            isExpanded ? 'text-[9px]' : 'text-[11px] mt-0.5'
          } ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            CMS Securities Premium Management System
          </p>
        </div>

        {/* Center Spacer */}
        <div className={`hidden md:block transition-all duration-[800ms] ease-in-out ${isExpanded ? 'flex-grow' : 'w-0'}`} />

        {/* Right Side: Returns - Red for Positive, Blue for Negative */}
        <div className={`flex flex-col transition-all duration-[800ms] transform ease-in-out ${
          isExpanded ? 'md:items-end scale-90' : 'items-center text-center scale-100'
        }`}>
          <span className={`text-[11px] font-black uppercase tracking-wider mb-0.5 transition-opacity duration-[800ms] ${
            isExpanded ? 'opacity-40' : 'opacity-100'
          } ${isDarkMode ? 'text-slate-300' : 'text-gray-400'}`}>
            평균 누적 수익률
          </span>
          <div className={`font-black flex items-center leading-none transition-all duration-[800ms] ${
            isExpanded ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
          } ${
            isPositive
              ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
              : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
          }`}>
            <span className={`mr-0.5 font-bold ${isExpanded ? 'text-sm' : 'text-xl'}`}>{isPositive ? '+' : ''}</span>
            {averageReturn.toFixed(2)}
            <span className={`ml-0.5 font-bold ${isExpanded ? 'text-sm' : 'text-xl'}`}>%</span>
            <span className={`ml-2 transition-transform duration-[800ms] ${isExpanded ? 'text-lg rotate-0' : 'text-xl rotate-12'} opacity-80`}>
              {isPositive ? '↑' : '↓'}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Toggle Button Section */}
      <div className={`flex justify-center transition-all duration-[800ms] ${
        isExpanded ? 'mt-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 pb-1' : 'mt-8 pb-1'
      }`}>
        <button
          onClick={onToggle}
          className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[11px] tracking-tight transition-all duration-[600ms] transform hover:scale-105 active:scale-95 overflow-hidden shadow-xl ${
            isExpanded
              ? (isDarkMode ? 'bg-slate-800/80 text-slate-400 border border-slate-700' : 'bg-gray-100 text-gray-500 border border-gray-200 shadow-none hover:bg-gray-200')
              : 'bg-primary text-white shadow-primary/30'
          }`}
        >
          {!isExpanded && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          )}
          
          <span className="relative z-10">
            {isExpanded ? '포트폴리오 요약하기' : '포트폴리오 구성 종목 보기'}
          </span>
          
          <div className={`relative z-10 transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'animate-bounce-subtle'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SummaryCard;
