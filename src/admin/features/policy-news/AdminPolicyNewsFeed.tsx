import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PolicyNews } from '@/shared/types';
import { SearchInput } from '@/shared/components/ui';
import { supabase } from '@/shared/lib/supabase';
import { adminAction } from '@/shared/lib/adminApi';
import { toast, confirm, useAdminAuthStore } from '@/shared/stores';
import {
  IssueCard,
  IssueModal,
  ExcelUploadGuideModal,
  ExcelUploadResultModal,
  FeedItem,
  ImageUpload,
  ExcelUploadResult,
} from '@/admin/features/issues/components';

interface AdminPolicyNewsFeedProps {
  policyNews: PolicyNews[];
  onRefresh: () => void;
}

interface PolicyNewsFormData {
  stockId: string;
  stockName: string;
  title: string;
  content: string;
  keywords: string;
  date: string;
  isCMS: boolean;
  id?: string;
  existingImages?: string[];
}

const AdminPolicyNewsFeed: React.FC<AdminPolicyNewsFeedProps> = ({
  policyNews,
  onRefresh,
}) => {
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showExcelUploadGuide, setShowExcelUploadGuide] = useState(false);
  const [excelUploadResult, setExcelUploadResult] = useState<ExcelUploadResult | null>(null);

  const scrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollPositionRef.current !== null) {
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = null;
    }
  }, [policyNews]);

  const [searchQuery, setSearchQuery] = useState<string>('');

  // 피드 아이템 생성 (FeedItem 형태로 변환)
  const feedItems = useMemo(() => {
    return policyNews.map((news): FeedItem => ({
      id: news.id,
      stockId: '',
      stockName: '',
      stockTicker: '',
      isCMS: news.isCMS,
      title: news.title || '',
      content: news.content,
      keywords: news.keywords || [],
      date: news.date,
      images: news.images?.map(img => ({ url: img.url, caption: img.caption })),
    }));
  }, [policyNews]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return feedItems;
    return feedItems.filter(item => {
      const title = (item.title || '').toLowerCase();
      const keywords = (item.keywords || []).join(' ').toLowerCase();
      return title.includes(query) || keywords.includes(query);
    });
  }, [feedItems, searchQuery]);

  // 추가
  const handleAdd = async (data: PolicyNewsFormData, imageUploads: ImageUpload[]) => {
    setIsUploading(true);
    try {
      const keywords = data.keywords
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k);

      let newsId: string | null = null;

      if (import.meta.env.PROD) {
        const result = await adminAction<{ success: boolean; policyNewsId?: string }>('add_policy_news', {
          title: data.title,
          content: data.content,
          keywords,
          date: data.date,
          isCMS: data.isCMS,
        });
        newsId = result.policyNewsId || null;
      } else {
        const adminCode = getAdminCode();
        const { data: inserted, error } = await supabase.rpc('admin_insert_policy_news', {
          admin_code: adminCode,
          p_title: data.title,
          p_content: data.content,
          p_keywords: keywords,
          p_date: data.date,
          p_is_cms: data.isCMS,

        });
        if (error) {
          // Fallback: direct insert (dev only)
          const { data: directInsert, error: directError } = await supabase
            .from('policy_news')
            .insert({
              title: data.title || null,
              content: data.content,
              keywords,
              date: data.date,
              is_cms: data.isCMS,

            })
            .select('id')
            .single();
          if (directError) throw directError;
          newsId = directInsert?.id || null;
        } else {
          newsId = inserted;
        }
      }

      // 이미지 업로드
      if (imageUploads.length > 0 && newsId) {
        const uploadedUrls: string[] = [];
        for (const img of imageUploads) {
          const fileName = `policy-news/${newsId}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            uploadedUrls.push(urlData.publicUrl);
          }
        }
        if (uploadedUrls.length > 0) {
          if (import.meta.env.PROD) {
            await adminAction('update_policy_news_images', { policyNewsId: newsId, images: uploadedUrls });
          } else {
            await supabase
              .from('policy_news')
              .update({ images: uploadedUrls, updated_at: new Date().toISOString() })
              .eq('id', newsId);
          }
        }
      }

      setShowAddModal(false);
      toast.success('정책 뉴스가 추가되었습니다.');
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : '';
      if (message.includes('동일한 날짜') || message.includes('409')) {
        toast.error('이미 동일한 날짜와 제목의 정책 뉴스가 존재합니다.');
      } else {
        toast.error('추가 실패');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 수정
  const handleUpdate = async (data: PolicyNewsFormData, imageUploads: ImageUpload[]) => {
    setIsUploading(true);
    try {
      let allImageUrls = [...(data.existingImages || [])];

      if (imageUploads.length > 0) {
        for (const img of imageUploads) {
          const fileName = `policy-news/${data.id}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            allImageUrls.push(urlData.publicUrl);
          }
        }
      }

      const keywords = data.keywords
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k);

      if (import.meta.env.PROD) {
        await adminAction('update_policy_news', {
          policyNewsId: data.id,
          title: data.title,
          content: data.content,
          keywords,
          date: data.date,
          isCMS: data.isCMS,
          images: allImageUrls,
        });
      } else {
        await supabase
          .from('policy_news')
          .update({
            title: data.title || null,
            content: data.content,
            keywords,
            date: data.date,
            is_cms: data.isCMS,
            images: allImageUrls,
            client_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      }

      setShowEditModal(false);
      setEditingItem(null);
      toast.success('정책 뉴스가 수정되었습니다.');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('수정 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // 삭제
  const handleDelete = async (newsId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;

    try {
      if (import.meta.env.PROD) {
        await adminAction('delete_policy_news', { policyNewsId: newsId });
      } else {
        const { error } = await supabase.from('policy_news').delete().eq('id', newsId);
        if (error) throw error;
      }
      toast.success('정책 뉴스가 삭제되었습니다.');
      scrollPositionRef.current = window.scrollY;
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('삭제 실패');
    }
  };

  const openEditModal = (item: FeedItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // 엑셀 업로드
  const handleExcelUpload = async (file: File) => {
    setIsExcelUploading(true);
    setExcelUploadResult(null);

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{ date?: string | number | Date; title?: string; content?: string; keywords?: string; is_cms?: boolean | string | number }>(sheet);

      const { convertExcelDate, parseIsCms } = await import('@/admin/features/issues/utils/issueExcelParser');

      const parsedRows = rows
        .filter(row => row.date && row.title && row.content)
        .map(row => ({
          date: convertExcelDate(row.date),
          title: row.title!,
          content: row.content!,
          is_cms: parseIsCms(row.is_cms),
          keywords: row.keywords ? String(row.keywords).split(',').map(k => k.trim()).filter(k => k) : [],
        }));

      if (parsedRows.length === 0) {
        setExcelUploadResult({
          inserted: 0,
          skipped: [],
          errors: [{ ticker: '-', row: 0, reason: '유효한 데이터가 없습니다. date, title, content는 필수입니다.' }],
        });
        return;
      }

      const bulkData = parsedRows.map(row => ({
        title: row.title,
        content: row.content,
        keywords: row.keywords,
        date: row.date,
        is_cms: row.is_cms,
        client_id: null,
      }));

      if (import.meta.env.PROD) {
        const result = await adminAction<{
          success: boolean;
          inserted: number;
          duplicates: string[];
          duplicate_count: number;
          errors: Array<{ client_name: string; row: number; reason: string }>;
        }>('bulk_insert_policy_news', { data: bulkData });
        setExcelUploadResult({
          inserted: result.inserted ?? 0,
          skipped: [],
          duplicates: result.duplicates ?? [],
          duplicate_count: result.duplicate_count ?? 0,
          errors: (result.errors ?? []).map(e => ({ ticker: e.client_name, row: e.row, reason: e.reason })),
        });
      } else {
        let inserted = 0;
        const duplicates: string[] = [];
        for (const item of bulkData) {
          const { data: existing } = await supabase
            .from('policy_news')
            .select('id')
            .eq('date', item.date)
            .eq('title', item.title)
            .maybeSingle();

          if (existing) {
            duplicates.push(`${item.date} / ${item.title}`);
            continue;
          }

          const { error } = await supabase.from('policy_news').insert({
            title: item.title || null,
            content: item.content,
            keywords: item.keywords || [],
            date: item.date,
            is_cms: item.is_cms ?? false,
          });
          if (!error) inserted++;
        }
        setExcelUploadResult({
          inserted,
          skipped: [],
          duplicates,
          duplicate_count: duplicates.length,
          errors: [],
        });
      }
    } catch (err: unknown) {
      console.error('엑셀 처리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '엑셀 파일 처리 중 오류가 발생했습니다.';
      setExcelUploadResult({
        inserted: 0,
        skipped: [],
        errors: [{ ticker: '-', row: 0, reason: errorMessage }],
      });
    } finally {
      setIsExcelUploading(false);
    }
  };

  const handleCloseExcelResult = () => {
    const hadInserts = (excelUploadResult?.inserted ?? 0) > 0;
    setExcelUploadResult(null);
    if (hadInserts) onRefresh();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">정책 뉴스 관리 ({feedItems.length}건)</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExcelUploadGuide(true)}
            disabled={isExcelUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-slate-700 text-emerald-400 text-xs font-black hover:bg-emerald-900/50 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isExcelUploading ? '업로드 중...' : '엑셀 일괄 등록'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-900/30 border border-slate-700 text-purple-400 text-xs font-black hover:bg-purple-900/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            정책 뉴스 추가
          </button>
        </div>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="제목, 키워드로 검색..."
          isDarkMode={true}
          className="w-full"
        />
      </div>

      <div className="max-w-5xl mx-auto">
        {filteredItems.map((item) => (
          <IssueCard
            key={item.id}
            item={item}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isPolicyNews
          />
        ))}

        {feedItems.length === 0 && (
          <div className="text-center py-20 text-slate-300 font-bold">등록된 정책 뉴스가 없습니다.</div>
        )}

        {filteredItems.length === 0 && searchQuery.trim() && feedItems.length > 0 && (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-bold">'{searchQuery.trim()}'에 대한 검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      <IssueModal
        mode="add"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        stocks={[]}
        isUploading={isUploading}
        isPolicyNews
      />

      {/* 수정 모달 */}
      <IssueModal
        mode="edit"
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleUpdate}
        stocks={[]}
        editItem={editingItem || undefined}
        isUploading={isUploading}
        isPolicyNews
      />

      {/* 엑셀 업로드 가이드 모달 */}
      <ExcelUploadGuideModal
        isOpen={showExcelUploadGuide}
        onClose={() => setShowExcelUploadGuide(false)}
        onFileSelect={handleExcelUpload}
        isPolicyNews
      />

      {/* 엑셀 업로드 결과 모달 */}
      <ExcelUploadResultModal result={excelUploadResult} onClose={handleCloseExcelResult} />
    </div>
  );
};

export default AdminPolicyNewsFeed;
