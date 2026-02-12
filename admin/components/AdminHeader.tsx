import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

interface AdminHeaderProps {
  onLogout: () => void;
}

const tabs = [
  { path: '/admin/portfolio', label: '포트폴리오', matchPrefix: false },
  { path: '/admin/stocks', label: '종목 관리', matchPrefix: true },
  { path: '/admin/issues', label: '뉴스 관리', matchPrefix: false },
  { path: '/admin/resources', label: '자료실 관리', matchPrefix: false },
  { path: '/admin/glossary', label: '용어사전', matchPrefix: false },
  { path: '/admin/analytics', label: '조회수 분석', matchPrefix: false },
  { path: '/admin/settings', label: '설정', matchPrefix: false },
];

const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isTabActive = (tab: typeof tabs[0]) => {
    if (tab.matchPrefix) {
      return location.pathname.startsWith(tab.path);
    }
    return location.pathname === tab.path;
  };

  return (
    <header className="border-b sticky top-0 z-50 bg-[#0a192f] border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* 상단 헤더 */}
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-lg shadow-sm tracking-tighter">
              CMS
            </div>
            <span className="text-red-500 font-black text-sm tracking-wider">ADMIN</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              사용자 페이지
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <nav className="flex gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`pb-4 text-[12px] font-black tracking-wider transition-all relative whitespace-nowrap ${
                  isActive ? 'text-red-400' : 'text-slate-300 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-red-500 rounded-full" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;
