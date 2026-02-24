import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Stock, StockIssue } from '@/shared/types';

interface IssueFormData {
  id?: string;
  stockId: string;
  title: string;
  content: string;
  keywords: string;
  date: string;
  isCMS: boolean;
  existingImages?: string[];
}
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { toast, confirm, useAdminAuthStore } from '@/shared/stores';
import {
  IssueCard,
  IssueModal,
  ExcelUploadGuideModal,
  ExcelUploadResultModal,
  FeedItem,
  ImageUpload,
  ExcelUploadResult,
} from './components';

interface AdminIssuesFeedProps {
  stocks: Stock[];
  glossary: Record<string, string>;
  onRefresh: () => void;
}

/**
 * AdminIssuesFeed 컴포넌트
 *
 * 리팩토링 후:
 * - 기존 1,123줄 → 약 300줄 (73% 감소)
 * - 모달 로직을 IssueModal로 분리
 * - 피드 아이템을 IssueCard로 분리
 * - 엑셀 업로드 UI를 ExcelUploadModal로 분리
 * - 이미지 업로드를 ImageUploader로 분리
 */
const AdminIssuesFeed: React.FC<AdminIssuesFeedProps> = ({
  stocks,
  glossary: _glossary,
  onRefresh,
}) => {
  // Admin 인증 (store 사용)
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 엑셀 업로드 상태
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [showExcelUploadGuide, setShowExcelUploadGuide] = useState(false);
  const [excelUploadResult, setExcelUploadResult] = useState<ExcelUploadResult | null>(null);

  // 스크롤 위치 복원용
  const scrollPositionRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollPositionRef.current !== null) {
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = null;
    }
  }, [stocks]);

  // 피드 아이템 생성
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    stocks.forEach((stock) => {
      if (stock.issues && stock.issues.length > 0) {
        stock.issues.forEach((issue: StockIssue & { id?: string }) => {
          items.push({
            id: issue.id || '',
            stockId: stock.id,
            stockName: stock.nameKr,
            stockTicker: stock.ticker,
            isCMS: issue.isCMS ?? false,
            title: issue.title || '',
            content: issue.content,
            keywords: issue.keywords || [],
            date: issue.date,
            images: issue.images || [],
          });
        });
      }
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [stocks]);

  // 이슈 추가
  const handleAddIssue = async (data: IssueFormData, imageUploads: ImageUpload[]) => {
    setIsUploading(true);
    const adminCode = getAdminCode();

    try {
      // 1. 이슈 생성 (RPC)
      const { data: issueId, error: issueError } = await getAdminSupabase().rpc('add_issue', {
        admin_code: adminCode,
        p_stock_id: data.stockId,
        p_title: data.title,
        p_content: data.content,
        p_keywords: data.keywords
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k),
        p_date: data.date,
        p_is_cms: data.isCMS,
      });

      if (issueError) throw issueError;

      // 2. 이미지 업로드
      if (imageUploads.length > 0 && issueId) {
        const stock = stocks.find((s) => s.id === data.stockId);
        const ticker = stock?.ticker || data.stockId;
        const uploadedUrls: string[] = [];

        for (const img of imageUploads) {
          const fileName = `issues/${ticker}/${issueId}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            uploadedUrls.push(urlData.publicUrl);
          }
        }

        // 이미지 URL 업데이트
        if (uploadedUrls.length > 0) {
          await getAdminSupabase().rpc('update_issue_images', {
            admin_code: adminCode,
            p_issue_id: issueId,
            p_images: uploadedUrls,
          });
        }
      }

      setShowAddModal(false);
      toast.success('뉴스가 추가되었습니다.');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('추가 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // 이슈 수정
  const handleUpdateIssue = async (data: IssueFormData, imageUploads: ImageUpload[]) => {
    setIsUploading(true);
    const adminCode = getAdminCode();

    try {
      let allImageUrls = [...(data.existingImages || [])];

      // 새 이미지 업로드
      if (imageUploads.length > 0) {
        const stock = stocks.find((s) => s.id === data.stockId);
        const ticker = stock?.ticker || data.stockId;

        for (const img of imageUploads) {
          const fileName = `issues/${ticker}/${data.id}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            allImageUrls.push(urlData.publicUrl);
          }
        }
      }

      // 이슈 업데이트 (RPC)
      const { error: updateError } = await getAdminSupabase().rpc('update_issue', {
        admin_code: adminCode,
        p_issue_id: data.id,
        p_title: data.title,
        p_content: data.content,
        p_keywords: data.keywords
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k),
        p_date: data.date,
        p_is_cms: data.isCMS,
        p_images: allImageUrls,
      });

      if (updateError) throw updateError;

      setShowEditModal(false);
      setEditingItem(null);
      toast.success('뉴스가 수정되었습니다.');
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('수정 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // 이슈 삭제
  const handleDeleteIssue = async (issueId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;

    const adminCode = getAdminCode();

    try {
      const { error } = await getAdminSupabase().rpc('delete_issue', {
        admin_code: adminCode,
        p_issue_id: issueId,
      });
      if (error) throw error;
      toast.success('뉴스가 삭제되었습니다.');
      // 스크롤 위치 저장 후 새로고침
      scrollPositionRef.current = window.scrollY;
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('삭제 실패');
    }
  };

  // 수정 모달 열기
  const openEditModal = (item: FeedItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // 엑셀 날짜 변환 함수 (Excel serial number -> YY/MM/DD)
  const convertExcelDate = (dateValue: unknown): string => {
    // 이미 문자열인 경우
    if (typeof dateValue === 'string') {
      return dateValue;
    }
    // 숫자인 경우 (Excel serial number)
    if (typeof dateValue === 'number') {
      // Excel 날짜를 JavaScript Date로 변환
      // Excel은 1900년 1월 1일을 1로 시작 (윤년 버그로 인해 -2 보정)
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
      const yy = String(jsDate.getFullYear()).slice(-2);
      const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
      const dd = String(jsDate.getDate()).padStart(2, '0');
      return `${yy}/${mm}/${dd}`;
    }
    // Date 객체인 경우
    if (dateValue instanceof Date) {
      const yy = String(dateValue.getFullYear()).slice(-2);
      const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
      const dd = String(dateValue.getDate()).padStart(2, '0');
      return `${yy}/${mm}/${dd}`;
    }
    return String(dateValue);
  };

  // 엑셀 업로드 처리
  const handleExcelUpload = async (file: File) => {
    setIsExcelUploading(true);
    setExcelUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{
        ticker?: string;
        date?: string | number | Date;
        title?: string;
        content?: string;
        source?: string;
        is_cms?: boolean | string | number;
        keywords?: string;
      }>(sheet);

      const bulkData = rows
        .filter((row) => row.ticker && row.date && row.title && row.content)
        .map((row) => ({
          ticker: row.ticker,
          date: convertExcelDate(row.date),
          title: row.title,
          content: row.content,
          source: row.source || '',
          is_cms: row.is_cms === true || row.is_cms === 'TRUE' || row.is_cms === 1,
          keywords: row.keywords
            ? row.keywords
                .split(',')
                .map((k) => k.trim())
                .filter((k) => k)
            : [],
        }));

      if (bulkData.length === 0) {
        setExcelUploadResult({
          inserted: 0,
          skipped: [],
          errors: [
            {
              ticker: '-',
              row: 0,
              reason: '유효한 데이터가 없습니다. ticker, date, title, content는 필수입니다.',
            },
          ],
        });
        return;
      }

      const adminCode = getAdminCode();
      const { data: result, error } = await supabase.rpc('bulk_insert_issues', {
        admin_code: adminCode,
        data: bulkData,
      });

      if (error) throw error;

      setExcelUploadResult({
        inserted: result?.inserted ?? 0,
        skipped: result?.skipped ?? [],
        duplicates: result?.duplicates ?? [],
        duplicate_count: result?.duplicate_count ?? 0,
        errors: result?.errors ?? [],
      });
    } catch (err: unknown) {
      console.error('엑셀 처리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '엑셀 파일 처리 중 오류가 발생했습니다.';
      setExcelUploadResult({
        inserted: 0,
        skipped: [],
        errors: [
          { ticker: '-', row: 0, reason: errorMessage },
        ],
      });
    } finally {
      setIsExcelUploading(false);
    }
  };

  // 엑셀 결과 모달 닫기
  const handleCloseExcelResult = () => {
    const hadInserts = excelUploadResult?.inserted ?? 0 > 0;
    setExcelUploadResult(null);
    if (hadInserts) onRefresh();
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">뉴스 관리 ({feedItems.length}건)</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExcelUploadGuide(true)}
            disabled={isExcelUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-slate-700 text-emerald-400 text-xs font-black hover:bg-emerald-900/50 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {isExcelUploading ? '업로드 중...' : '엑셀 일괄 등록'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            뉴스 추가
          </button>
        </div>
      </div>

      {/* 피드 리스트 */}
      <div className="max-w-5xl mx-auto">
        {feedItems.map((item) => (
          <IssueCard
            key={`${item.stockId}-${item.id}`}
            item={item}
            onEdit={openEditModal}
            onDelete={handleDeleteIssue}
          />
        ))}

        {feedItems.length === 0 && (
          <div className="text-center py-20 text-slate-300 font-bold">등록된 뉴스가 없습니다.</div>
        )}
      </div>

      {/* 추가 모달 */}
      <IssueModal
        mode="add"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddIssue}
        stocks={stocks}
        isUploading={isUploading}
      />

      {/* 수정 모달 */}
      <IssueModal
        mode="edit"
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleUpdateIssue}
        stocks={stocks}
        editItem={editingItem || undefined}
        isUploading={isUploading}
      />

      {/* 엑셀 업로드 가이드 모달 */}
      <ExcelUploadGuideModal
        isOpen={showExcelUploadGuide}
        onClose={() => setShowExcelUploadGuide(false)}
        onFileSelect={handleExcelUpload}
      />

      {/* 엑셀 업로드 결과 모달 */}
      <ExcelUploadResultModal result={excelUploadResult} onClose={handleCloseExcelResult} />
    </div>
  );
};

export default AdminIssuesFeed;
