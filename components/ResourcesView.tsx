
import React, { useState, useMemo } from 'react';
import { Resource } from '../types';

interface ResourcesViewProps {
  isDarkMode: boolean;
}

const SAMPLE_RESOURCES: Resource[] = [
  {
    id: 'res-01',
    title: '2024 중국 매크로 및 테크 산업 투자 전략 보고서',
    description: '반도체, 2차전지 등 핵심 산업별 밸류에이션 및 투자 매력도 상세 분석 리포트',
    fileType: 'PDF',
    category: '전략 보고서',
    date: '2024.12.20',
    fileSize: '4.2 MB'
  },
  {
    id: 'res-02',
    title: '보세라 차이나 포트폴리오 정기 성과 분석 (24년 12월호)',
    description: '12월 한 달간의 포트폴리오 수익률 리뷰 및 개별 종목 기여도 분석 자료',
    fileType: 'EXCEL',
    category: '성과 분석',
    date: '2024.12.15',
    fileSize: '1.8 MB'
  },
  {
    id: 'res-03',
    title: '중국 반도체 장비 국산화 현황 및 전망',
    description: '북방화창, 중미반도체 등 핵심 기업의 기술력 및 수주 현황 추적 리포트',
    fileType: 'PDF',
    category: '산업 리포트',
    date: '2024.12.10',
    fileSize: '3.5 MB'
  },
  {
    id: 'res-04',
    title: '포트폴리오 주요 종목 3Q25 실적 요약 테이블',
    description: '관리 종목 전체의 매출액, 영업이익 및 컨센서스 상회 여부 일람표',
    fileType: 'EXCEL',
    category: '성과 분석',
    date: '2024.11.25',
    fileSize: '0.9 MB'
  }
];

const CATEGORIES = ['전체', '전략 보고서', '성과 분석', '산업 리포트'];

const ResourcesView: React.FC<ResourcesViewProps> = ({ isDarkMode }) => {
  const [activeCategory, setActiveCategory] = useState('전체');

  const filteredResources = useMemo(() => {
    if (activeCategory === '전체') return SAMPLE_RESOURCES;
    return SAMPLE_RESOURCES.filter(res => res.category === activeCategory);
  }, [activeCategory]);

  const getFileTypeStyles = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-blue-50 text-primary border-blue-100 dark:bg-primary/20 dark:text-blue-400 dark:border-primary/30';
      case 'EXCEL': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'WORD': return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30';
      default: return 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'EXCEL':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 2v-6m-8-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>프리미엄 투자 자료실</h2>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-400'}`}>Total {filteredResources.length} Files</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all border ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                : isDarkMode
                  ? 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
                  : 'bg-gray-100 text-gray-500 border-gray-100 hover:bg-gray-200'
            }`}
          >{cat}</button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filteredResources.length > 0 ? filteredResources.map((res) => (
          <div key={res.id} className={`group flex flex-col md:flex-row rounded-2xl border transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-[#112240] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-primary shadow-sm'}`}>
            <div className={`flex items-center p-4 md:p-5 md:w-[45%] border-b md:border-b-0 md:border-r gap-4 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300 ${getFileTypeStyles(res.fileType)}`}>{getFileIcon(res.fileType)}</div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isToday(res.date) ? 'text-primary' : 'opacity-40'}`}>{res.fileType}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>{res.category}</span>
                </div>
                <h3 className={`text-[14px] font-black leading-tight tracking-tight truncate group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{res.title}</h3>
              </div>
            </div>
            <div className={`flex items-center justify-between p-4 md:px-6 md:py-2 md:w-[55%] ${isDarkMode ? 'bg-slate-900/20' : 'bg-gray-50/20'}`}>
              <div className="flex-1 min-w-0 mr-4">
                <p className={`text-[12px] font-medium truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{res.description}</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-black text-[11px] shadow-sm hover:bg-primary/90 transition-all transform active:scale-95 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                다운로드
              </button>
            </div>
          </div>
        )) : <div className="py-20 text-center opacity-30 font-black">자료가 없습니다.</div>}
      </div>
    </div>
  );
};

const isToday = (dateStr: string) => {
  const today = new Date();
  const date = dateStr.replace(/\./g, '-');
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

export default ResourcesView;
