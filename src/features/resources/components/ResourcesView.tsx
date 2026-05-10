import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { DbResourceRow, Resource, Stock } from '@/shared/types';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/stores';
import { SearchInput } from '@/shared/components/ui';
import { TextWithCMS } from '@/shared/components/TextWithCMS';

interface ResourcesViewProps {
  stocks: Stock[];
  onStockClick: (stock: Stock) => void;
  isDarkMode: boolean;
}

type ResourceTab = 'company' | 'policy';

const resolveDate = (date: string, createdAt?: string | null, updatedAt?: string | null): string => {
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(date)) return date;
  const fallback = updatedAt || createdAt;
  if (fallback) {
    const d = new Date(fallback);
    if (!isNaN(d.getTime())) {
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}/${mm}/${dd}`;
    }
  }
  return date;
};

const toResource = (row: DbResourceRow): Resource => ({
  id: row.id,
  stockId: row.stock_id,
  title: row.title,
  description: row.description ?? '',
  keywords: row.keywords ?? [],
  fileType: row.file_type,
  category: row.category ?? '정책',
  date: row.date,
  fileSize: row.file_size ?? '',
  fileUrl: row.file_url ?? undefined,
  originalFilename: row.original_filename ?? undefined,
  clientId: row.client_id ?? undefined,
  clientIds: row.client_ids ?? (row.client_id ? [row.client_id] : []),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const isResourceVisibleToClients = (row: DbResourceRow, clientIds: string[]) => {
  const targetClientIds = row.client_ids ?? (row.client_id ? [row.client_id] : []);
  if (targetClientIds.length === 0) return true;
  return targetClientIds.some((clientId) => clientIds.includes(clientId));
};

const ResourcesView: React.FC<ResourcesViewProps> = ({ stocks, onStockClick, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<ResourceTab>('company');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasAutoSelectedRef = useRef(false);

  const clientInfo = useAuthStore((state) => state.clientInfo);
  const sharedClientIds = useAuthStore((state) => state.clientIds);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const accessibleClientIds = Array.from(new Set([
          ...(clientInfo?.id ? [clientInfo.id] : []),
          ...sharedClientIds,
        ]));

        const { data, error } = await supabase.from('resources').select('*').order('date', { ascending: false });
        if (error) throw error;
        const visibleRows = ((data ?? []) as DbResourceRow[]).filter((row) => isResourceVisibleToClients(row, accessibleClientIds));
        setResources(visibleRows.map(toResource));
      } catch (err) {
        console.error('자료실 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [clientInfo?.id, sharedClientIds]);

  const companyResources = useMemo(
    () => resources.filter((resource) => resource.category === '기업'),
    [resources],
  );
  const policyResources = useMemo(
    () => resources.filter((resource) => resource.category === '정책'),
    [resources],
  );

  useEffect(() => {
    if (activeTab === 'company' && companyResources.length === 0 && policyResources.length > 0 && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
      setActiveTab('policy');
    }
  }, [activeTab, companyResources.length, policyResources.length]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getDownloadFilename = useCallback((resource: Resource) => {
    if (resource.originalFilename) return resource.originalFilename;
    const extMap: Record<string, string> = { PDF: '.pdf', EXCEL: '.xlsx', WORD: '.docx', PPT: '.pptx' };
    return `${resource.title}${extMap[resource.fileType] || ''}`;
  }, []);

  const handleDownload = useCallback(async (resource: Resource) => {
    if (!resource.fileUrl) return;
    try {
      const response = await fetch(resource.fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = getDownloadFilename(resource);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('다운로드 실패:', err);
      window.open(resource.fileUrl, '_blank');
    }
  }, [getDownloadFilename]);

  const visibleResources = activeTab === 'company' ? companyResources : policyResources;

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleResources;
    return visibleResources.filter((resource) => {
      const stock = stocks.find((item) => item.id === resource.stockId);
      const fields = [
        resource.title,
        resource.description,
        resource.keywords.join(' '),
        stock?.nameKr,
        stock?.ticker,
      ].filter(Boolean);
      return fields.some((value) => String(value).toLowerCase().includes(query));
    });
  }, [searchQuery, stocks, visibleResources]);

  const formatDateTime = (timestamp?: string | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}. ${hh}:${min}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-5 py-2 text-[13px] font-black tracking-wide transition-all rounded-lg ${
                activeTab === 'company'
                  ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')
              }`}
            >
              기업 코멘트
            </button>
            <div className={`w-px h-5 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-5 py-2 text-[13px] font-black tracking-wide transition-all rounded-lg ${
                activeTab === 'policy'
                  ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-900 shadow-sm')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600')
              }`}
            >
              정책 코멘트
            </button>
          </div>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeTab === 'company' ? '제목, 키워드, 종목명, 티커로 검색...' : '제목, 키워드로 검색...'}
          isDarkMode={isDarkMode}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
          <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-bold">
            {searchQuery.trim()
              ? `'${searchQuery.trim()}'에 대한 검색 결과가 없습니다`
              : activeTab === 'company'
                ? '등록된 기업 코멘트가 없습니다'
                : '등록된 정책 코멘트가 없습니다'}
          </p>
        </div>
      ) : (
        filteredResources.map((resource) => {
          const stock = stocks.find((item) => item.id === resource.stockId) || null;
          const resolvedDate = resolveDate(resource.date, resource.createdAt, resource.updatedAt);

          return (
            <div
              key={resource.id}
              className={`relative pl-0 min-[425px]:pl-10 lg:pl-16 pb-5 min-[425px]:pb-8 group border-l-0 min-[425px]:border-l-[3px] transition-all ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
            >
              <div className="hidden min-[425px]:block absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 bg-primary border-white dark:border-primary/40 shadow-xl" />

              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-base lg:text-xl font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                    {resolvedDate}
                  </span>
                </div>

                {activeTab === 'company' && stock && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => onStockClick(stock)}
                      className={`text-base lg:text-lg font-black transition-all hover:translate-x-1 ${isDarkMode ? 'text-white hover:text-primary-accent' : 'text-gray-900 hover:text-primary'}`}
                    >
                      {stock.nameKr}
                    </button>
                    <span className={`text-[12px] lg:text-[13px] font-mono font-black tracking-widest px-2 py-0.5 rounded border-2 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                      {stock.ticker}
                    </span>
                  </div>
                )}
              </div>

              <div className={`rounded-[24px] px-6 py-6 lg:px-10 lg:py-8 border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                isDarkMode ? 'bg-[#112240] border-slate-700 border-l-4 border-l-primary shadow-lg' : 'bg-white border-gray-200 border-l-4 border-l-primary shadow-md'
              }`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    {resource.title && (
                      <h4 className={`text-xl lg:text-[2rem] font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <TextWithCMS text={resource.title} isDarkMode={isDarkMode} isTitle={true} glossary={{}} />
                      </h4>
                    )}

                    <div className={`mt-3 text-[12px] lg:text-[13px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      <span>업데이트</span>
                      <span className="ml-2">
                        {formatDateTime(resource.updatedAt) || formatDateTime(resource.createdAt) || resolvedDate}
                      </span>
                    </div>
                  </div>

                  {resource.fileUrl && (
                    <button
                      onClick={() => handleDownload(resource)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-[12px] lg:text-[13px] transition-all transform active:scale-95 ${
                        isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      다운로드
                    </button>
                  )}
                </div>

                <div className={`border-t mb-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} />

                <div className={`text-[15px] lg:text-[16px] leading-[1.85] whitespace-pre-wrap font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                  <TextWithCMS text={resource.description} isDarkMode={isDarkMode} hideBadge={true} glossary={{}} />
                </div>

                <div className="mt-7 flex items-end justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {resource.keywords.map((keyword) => (
                      <span
                        key={`${resource.id}-${keyword}`}
                        className={`text-[12px] font-bold px-3 py-1 rounded-full border ${isDarkMode ? 'bg-transparent text-slate-300 border-slate-600' : 'bg-white text-gray-600 border-gray-300'}`}
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>

                  {activeTab === 'company' && stock && (
                    <button
                      onClick={() => onStockClick(stock)}
                      className={`shrink-0 text-[13px] font-bold flex items-center gap-1 transition-all hover:gap-2 ${isDarkMode ? 'text-slate-300 hover:text-slate-100' : 'text-accent hover:text-accent-dark'}`}
                    >
                      상세 보기
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
            : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
        }`}
        aria-label="맨 위로 이동"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ResourcesView;
