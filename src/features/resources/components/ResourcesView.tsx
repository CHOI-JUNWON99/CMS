import React, { useState, useMemo, useEffect } from 'react';
import { Resource, DbResourceRow } from '@/shared/types';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';
// 프리미엄 투자 자료실 컴포넌트
interface ResourcesViewProps {
  isDarkMode: boolean;
}

const ResourcesView: React.FC<ResourcesViewProps> = ({ isDarkMode }) => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 클라이언트 정보 (Zustand store 사용)
  const clientInfo = useAuthStore((state) => state.clientInfo);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        // 클라이언트 ID 가져오기 (store에서)
        const clientId = clientInfo?.id || null;

        let query = supabase.from('resources').select('*').order('date', { ascending: false });

        // 클라이언트가 설정된 경우: 해당 클라이언트 전용 자료 + 공개 자료
        if (clientId) {
          query = query.or(`client_id.eq.${clientId},client_id.is.null`);
        }
        // 클라이언트가 없는 경우: 공개 자료만
        else {
          query = query.is('client_id', null);
        }

        const { data } = await query;

        if (data) {
          setResources((data as DbResourceRow[]).map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description ?? '',
            fileType: r.file_type,
            category: r.category ?? '',
            date: r.date,
            fileSize: r.file_size ?? '',
            fileUrl: r.file_url ?? undefined,
          })));
        }
      } catch (err) {
        console.error('자료실 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category));
    return ['전체', ...Array.from(cats)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (activeCategory === '전체') return resources;
    return resources.filter(res => res.category === activeCategory);
  }, [activeCategory, resources]);

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
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-black transition-all border ${
              activeCategory === cat
                ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                : isDarkMode
                  ? 'bg-slate-800/40 text-slate-400 border-slate-700 hover:border-slate-500'
                  : 'bg-gray-100 text-gray-500 border-gray-100 hover:bg-gray-200'
            }`}
          >{cat}</button>
        ))}
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredResources.length > 0 ? filteredResources.map((res) => (
          <div key={res.id} className={`group flex flex-col lg:flex-row rounded-2xl border transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-[#112240] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-primary shadow-sm'}`}>
            <div className={`flex items-center p-4 lg:p-5 lg:w-[45%] border-b lg:border-b-0 lg:border-r gap-4 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300 ${getFileTypeStyles(res.fileType)}`}>{getFileIcon(res.fileType)}</div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isToday(res.date) ? 'text-primary' : 'opacity-40'}`}>{res.fileType}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>{res.category}</span>
                </div>
                <h3 className={`text-[14px] font-black leading-tight tracking-tight truncate group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{res.title}</h3>
              </div>
            </div>
            <div className={`flex items-center justify-between p-4 lg:px-6 lg:py-2 lg:w-[55%] ${isDarkMode ? 'bg-slate-900/20' : 'bg-gray-50/20'}`}>
              <div className="flex-1 min-w-0 mr-4">
                <p className={`text-[12px] font-medium truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{res.description}</p>
              </div>
              {res.fileUrl ? (
                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-black text-[11px] shadow-sm hover:bg-primary/90 transition-all transform active:scale-95 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  다운로드
                </a>
              ) : (
                <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-300 text-gray-500 font-black text-[11px] shrink-0 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  준비중
                </button>
              )}
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
