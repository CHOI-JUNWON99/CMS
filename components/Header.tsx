
import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  remainingTime?: string;
  onExtendSession?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, isDarkMode, toggleTheme, remainingTime, onExtendSession, onLogout }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 클라이언트 브랜딩 정보
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  const [_clientBrandColor, setClientBrandColor] = useState<string | null>(null);

  useEffect(() => {
    setClientName(localStorage.getItem('cms_client_name'));
    setClientLogo(localStorage.getItem('cms_client_logo'));
    setClientBrandColor(localStorage.getItem('cms_client_brand_color'));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) setIsMenuOpen(false);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  const isUrgent = remainingTime && (() => {
    const parts = remainingTime.split(':');
    return Number(parts[0]) === 0 && Number(parts[1]) < 10;
  })();

  const statusItems = (
    <>
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
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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

      {onLogout && (
        <button
          onClick={onLogout}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all active:scale-95 ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
          title="로그아웃"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>로그아웃</span>
        </button>
      )}
    </>
  );

  return (
    <header ref={menuRef} className={`border-b sticky top-0 z-50 transition-colors duration-300 ${isDarkMode ? 'bg-[#0a192f] border-slate-800' : 'bg-white border-gray-100'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onHomeClick}
        >
          <div className="bg-primary text-white font-black px-2 py-0.5 rounded text-lg shadow-sm tracking-tighter">
            CMS
          </div>

          {clientName ? (
            <div className="flex items-center">
              <span className={`mx-1 text-lg font-light ${isDarkMode ? 'text-slate-500' : 'text-gray-300'}`}>&</span>
              <div className="flex items-center gap-2 ml-1">
                {clientLogo && (
                  <img src={clientLogo} alt={clientName} className="h-6 w-auto object-contain" />
                )}
                <span className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {clientName}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <span className={`mx-1 text-lg font-light ${isDarkMode ? 'text-slate-500' : 'text-gray-300'}`}>&</span>
              <span className={`ml-1 text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Portfolio
              </span>
            </div>
          )}
        </div>

        {/* Desktop: inline items */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            {statusItems}
          </div>
        )}

        {/* Mobile: hamburger button */}
        {isMobile && (
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={`flex items-center justify-center p-2 rounded-lg transition-all ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="메뉴 열기"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {isMobile && isMenuOpen && (
        <div className={`border-t px-4 py-3 flex flex-wrap items-center gap-2 ${
          isDarkMode ? 'bg-[#0a192f] border-slate-800' : 'bg-white border-gray-100'
        }`}>
          {statusItems}
        </div>
      )}
    </header>
  );
};

export default Header;
