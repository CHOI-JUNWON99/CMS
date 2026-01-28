
import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  visitorCount?: number;
  remainingTime?: string;
  onExtendSession?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, isDarkMode, toggleTheme, visitorCount, remainingTime, onExtendSession }) => {
  const isUrgent = remainingTime && (() => {
    const parts = remainingTime.split(':');
    return Number(parts[0]) === 0 && Number(parts[1]) < 10;
  })();

  return (
    <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-[#0a192f] border-slate-800' : 'bg-white border-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onHomeClick}
        >
          <div className="bg-primary text-white font-black px-2 py-0.5 rounded text-lg shadow-sm tracking-tighter">
            CMS
          </div>

          <div className="flex items-center">
            <span className={`mx-1 text-lg font-light ${isDarkMode ? 'text-slate-500' : 'text-gray-300'}`}>&</span>

            <div className="flex items-baseline ml-1">
              <span className="text-primary font-black text-2xl tracking-tighter">신한</span>
              <span className={`ml-1 text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                증권 Wrap
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {visitorCount !== undefined && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{visitorCount.toLocaleString()}</span>
            </div>
          )}

          {remainingTime && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-colors ${
              isUrgent
                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 animate-pulse'
                : isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono tabular-nums">{remainingTime}</span>
            </div>
          )}

          {onExtendSession && (
            <button
              onClick={onExtendSession}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-black transition-all active:scale-95 ${
                isDarkMode
                  ? 'bg-primary/20 border-primary/40 text-primary-accent hover:bg-primary/30'
                  : 'bg-blue-50 border-blue-200 text-primary hover:bg-blue-100'
              }`}
              title="세션을 1시간 연장합니다"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>연장</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? "라이트 모드로 전환" : "나이트 모드로 전환"}
            className={`flex items-center justify-center p-2 rounded-full transition-all ${
              isDarkMode
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.485a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707zM3 9a1 1 0 000 2h1a1 1 0 100-2H3z" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
