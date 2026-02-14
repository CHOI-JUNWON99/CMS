import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Stock } from '../types';
import { supabase, getAdminSupabase } from '../lib/supabase';

interface AdminIssuesFeedProps {
  stocks: Stock[];
  glossary: Record<string, string>;
  onRefresh: () => void;
}

interface FeedItem {
  id: any;
  stockId: string;
  stockName: string;
  stockTicker: string;
  isCMS: boolean;
  title: string;
  content: string;
  keywords: string[];
  date: string;
  images?: { url: string; caption?: string }[];
}

interface ImageUpload {
  file: File;
  preview: string;
  caption: string;
}

const AdminIssuesFeed: React.FC<AdminIssuesFeedProps> = ({ stocks, glossary: _glossary, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [newIssue, setNewIssue] = useState({
    stockId: '',
    stockName: '',
    title: '',
    content: '',
    keywords: '',
    date: '',
    isCMS: false,
  });
  const [editIssue, setEditIssue] = useState<{
    id: any;
    stockId: string;
    stockName: string;
    title: string;
    content: string;
    keywords: string;
    date: string;
    isCMS: boolean;
    existingImages: string[];
  } | null>(null);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [editImageUploads, setEditImageUploads] = useState<ImageUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 엑셀 일괄 업로드 관련 state
  const [isExcelUploading, setIsExcelUploading] = useState(false);
  const [excelUploadResult, setExcelUploadResult] = useState<{
    inserted: number;
    skipped: string[];
    errors: { ticker: string; row: number; reason: string }[];
  } | null>(null);
  const [showExcelUploadGuide, setShowExcelUploadGuide] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // 종목 검색 필터링
  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return stocks;
    const query = stockSearch.toLowerCase();
    return stocks.filter(s =>
      s.nameKr.toLowerCase().includes(query) ||
      s.ticker.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
  }, [stocks, stockSearch]);

  // 모든 이슈를 하나의 피드로 합치기
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    stocks.forEach(stock => {
      if (stock.issues && stock.issues.length > 0) {
        stock.issues.forEach((issue: any) => {
          items.push({
            id: issue.id,
            stockId: stock.id,
            stockName: stock.nameKr,
            stockTicker: stock.ticker,
            isCMS: issue.isCMS ?? false,
            title: issue.title || '',
            content: issue.content,
            keywords: issue.keywords || [],
            date: issue.date,
            images: issue.images || [], // DB에서 가져온 이미지 URL
          });
        });
      }
    });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [stocks]);

  // 종목 선택
  const handleSelectStock = (stock: Stock) => {
    setNewIssue({ ...newIssue, stockId: stock.id, stockName: `${stock.nameKr} (${stock.ticker})` });
    setStockSearch('');
    setShowStockDropdown(false);
  };

  // 이미지 파일 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageUpload[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          caption: '',
        });
      }
    });

    setImageUploads(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImageUploads(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // 이미지 캡션 수정
  const handleCaptionChange = (index: number, caption: string) => {
    setImageUploads(prev => {
      const updated = [...prev];
      updated[index].caption = caption;
      return updated;
    });
  };

  // 뉴스 추가 (RPC 사용)
  const handleAddIssue = async () => {
    if (!newIssue.stockId || !newIssue.title || !newIssue.content || !newIssue.date) {
      alert('종목, 제목, 내용, 날짜는 필수입니다.');
      return;
    }

    setIsUploading(true);
    const adminCode = localStorage.getItem('cms_admin_code') || '';

    try {
      // 1. 이슈 먼저 생성 (RPC)
      const { data: issueId, error: issueError } = await getAdminSupabase().rpc('add_issue', {
        admin_code: adminCode,
        p_stock_id: newIssue.stockId,
        p_title: newIssue.title,
        p_content: newIssue.content,
        p_keywords: newIssue.keywords.split(',').map(k => k.trim()).filter(k => k),
        p_date: newIssue.date,
        p_is_cms: newIssue.isCMS,
      });

      if (issueError) throw issueError;

      // 2. 이미지 업로드 후 DB에 URL 저장
      if (imageUploads.length > 0 && issueId) {
        const stock = stocks.find(s => s.id === newIssue.stockId);
        const ticker = stock?.ticker || newIssue.stockId;
        const uploadedUrls: string[] = [];

        for (const img of imageUploads) {
          const fileName = `issues/${ticker}/${issueId}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);

          if (uploadError) {
            console.error('Storage 업로드 실패:', uploadError);
            continue;
          }

          // URL 수집
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        }

        // issues 테이블의 images 컬럼 업데이트 (RPC)
        if (uploadedUrls.length > 0) {
          const { error: updateError } = await getAdminSupabase().rpc('update_issue_images', {
            admin_code: adminCode,
            p_issue_id: issueId,
            p_images: uploadedUrls,
          });
          if (updateError) {
            console.error('이미지 URL 저장 실패:', updateError);
          }
        }
      }

      // 리셋
      setShowAddModal(false);
      setNewIssue({ stockId: '', stockName: '', title: '', content: '', keywords: '', date: '', isCMS: false });
      setImageUploads([]);
      setStockSearch('');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('추가 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // 뉴스 삭제 (RPC 사용)
  const handleDeleteIssue = async (issueId: any) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const adminCode = localStorage.getItem('cms_admin_code') || '';

    try {
      const { error } = await getAdminSupabase().rpc('delete_issue', {
        admin_code: adminCode,
        p_issue_id: issueId,
      });
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  // 오늘 날짜 자동 채우기
  const getTodayDate = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  };

  // 모달 열기
  const openAddModal = () => {
    setNewIssue({ stockId: '', stockName: '', title: '', content: '', keywords: '', date: getTodayDate(), isCMS: false });
    setImageUploads([]);
    setStockSearch('');
    setShowAddModal(true);
  };

  // 모달 닫기
  const closeAddModal = () => {
    imageUploads.forEach(img => URL.revokeObjectURL(img.preview));
    setShowAddModal(false);
    setNewIssue({ stockId: '', stockName: '', title: '', content: '', keywords: '', date: '', isCMS: false });
    setImageUploads([]);
    setStockSearch('');
  };

  // 수정 모달 열기
  const openEditModal = (item: FeedItem) => {
    setEditIssue({
      id: item.id,
      stockId: item.stockId,
      stockName: `${item.stockName} (${item.stockTicker})`,
      title: item.title,
      content: item.content,
      keywords: item.keywords.join(', '),
      date: item.date,
      isCMS: item.isCMS,
      existingImages: item.images?.map(img => img.url) || [],
    });
    setEditImageUploads([]);
    setShowEditModal(true);
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    editImageUploads.forEach(img => URL.revokeObjectURL(img.preview));
    setShowEditModal(false);
    setEditIssue(null);
    setEditImageUploads([]);
  };

  // 수정 이미지 선택
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageUpload[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          caption: '',
        });
      }
    });

    setEditImageUploads(prev => [...prev, ...newImages]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // 수정 이미지 삭제 (새로 추가한 이미지)
  const handleRemoveEditImage = (index: number) => {
    setEditImageUploads(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // 기존 이미지 삭제
  const handleRemoveExistingImage = (index: number) => {
    if (!editIssue) return;
    const updated = [...editIssue.existingImages];
    updated.splice(index, 1);
    setEditIssue({ ...editIssue, existingImages: updated });
  };

  // 뉴스 수정 (RPC 사용)
  const handleUpdateIssue = async () => {
    if (!editIssue || !editIssue.title || !editIssue.content || !editIssue.date) {
      alert('제목, 내용, 날짜는 필수입니다.');
      return;
    }

    setIsUploading(true);
    const adminCode = localStorage.getItem('cms_admin_code') || '';

    try {
      // 1. 새 이미지 업로드
      let allImageUrls = [...editIssue.existingImages];

      if (editImageUploads.length > 0) {
        const stock = stocks.find(s => s.id === editIssue.stockId);
        const ticker = stock?.ticker || editIssue.stockId;

        for (const img of editImageUploads) {
          const fileName = `issues/${ticker}/${editIssue.id}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, img.file);

          if (uploadError) {
            console.error('Storage 업로드 실패:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          allImageUrls.push(urlData.publicUrl);
        }
      }

      // 2. 이슈 업데이트 (RPC)
      const { error: updateError } = await getAdminSupabase().rpc('update_issue', {
        admin_code: adminCode,
        p_issue_id: editIssue.id,
        p_title: editIssue.title,
        p_content: editIssue.content,
        p_keywords: editIssue.keywords.split(',').map(k => k.trim()).filter(k => k),
        p_date: editIssue.date,
        p_is_cms: editIssue.isCMS,
        p_images: allImageUrls,
      });

      if (updateError) throw updateError;

      closeEditModal();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('수정 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // 엑셀 일괄 업로드 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExcelUploading(true);
    setExcelUploadResult(null);
    setShowExcelUploadGuide(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{
        ticker?: string;
        title?: string;
        content?: string;
        date?: string;
        is_cms?: boolean | string | number;
        keywords?: string;
      }>(sheet);

      // 데이터 변환
      const bulkData = rows
        .filter(row => row.ticker && row.title && row.content && row.date)
        .map(row => ({
          ticker: row.ticker,
          title: row.title,
          content: row.content,
          date: row.date,
          is_cms: row.is_cms === true || row.is_cms === 'TRUE' || row.is_cms === 1,
          keywords: row.keywords
            ? row.keywords.split(',').map(k => k.trim()).filter(k => k)
            : [],
        }));

      if (bulkData.length === 0) {
        setExcelUploadResult({
          inserted: 0,
          skipped: [],
          errors: [{ ticker: '-', row: 0, reason: '유효한 데이터가 없습니다. ticker, title, content, date는 필수입니다.' }],
        });
        return;
      }

      // RPC 호출
      const adminCode = localStorage.getItem('cms_admin_code') || '';
      const { data: result, error } = await supabase.rpc('bulk_insert_issues', {
        admin_code: adminCode,
        data: bulkData,
      });

      if (error) throw error;

      setExcelUploadResult({
        inserted: result?.inserted ?? 0,
        skipped: result?.skipped ?? [],
        errors: result?.errors ?? [],
      });
    } catch (err: any) {
      console.error('엑셀 처리 오류:', err);
      setExcelUploadResult({
        inserted: 0,
        skipped: [],
        errors: [{ ticker: '-', row: 0, reason: err.message || '엑셀 파일 처리 중 오류가 발생했습니다.' }],
      });
    } finally {
      setIsExcelUploading(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">뉴스 관리 ({feedItems.length}건)</h2>
        <div className="flex items-center gap-3">
          {/* 엑셀 일괄 업로드 버튼 */}
          <input
            ref={excelFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
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
          {/* 뉴스 추가 버튼 */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            뉴스 추가
          </button>
        </div>
      </div>

      {/* 피드 리스트 - 타임라인 스타일 */}
      <div className="max-w-5xl mx-auto">
        {feedItems.map((item) => (
            <div
              key={`${item.stockId}-${item.id}`}
              className="relative pl-10 lg:pl-16 pb-20 group border-l-[3px] border-slate-700"
            >
              {/* 타임라인 도트 */}
              <div className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 ${
                item.isCMS
                  ? 'bg-red-500 border-[#0a192f] shadow-xl'
                  : 'bg-slate-500 border-[#0a192f] shadow-lg'
              }`} />

              {/* 헤더: 날짜, 종목, 버튼 */}
              <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg lg:text-2xl font-black tracking-tighter text-white">{item.date}</span>
                    <span className="text-xs px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-red-600 text-white shadow-lg">
                      News
                    </span>
                    {item.isCMS && (
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black">
                        CMS증권
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(item)} className="text-blue-400 hover:text-blue-300 text-xs">수정</button>
                    <button onClick={() => handleDeleteIssue(item.id)} className="text-red-400 hover:text-red-300 text-xs">삭제</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base lg:text-lg font-black text-white">{item.stockName}</span>
                  <span className="text-[12px] font-mono font-black tracking-widest px-2 py-0.5 rounded border-2 bg-slate-800 text-slate-300 border-slate-600">{item.stockTicker}</span>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className={`rounded-[2rem] p-6 lg:p-8 border-2 transition-all duration-300 hover:-translate-y-1 ${
                item.isCMS
                  ? 'bg-slate-800 border-red-500/40 border-l-8 border-l-red-500 shadow-2xl'
                  : 'bg-[#112240] border-slate-600 hover:border-red-500 shadow-xl'
              }`}>
                {/* 키워드 */}
                {item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.keywords.map((kw, i) => (
                      <span key={i} className="text-[11px] font-black px-3 py-1 rounded-xl border-2 bg-slate-900 text-slate-100 border-slate-700">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* 제목 */}
                {item.title && (
                  <h4 className="text-lg lg:text-xl font-black mb-4 tracking-tight leading-tight text-white">
                    {item.title}
                  </h4>
                )}

                {/* 내용 */}
                <p className="text-[14px] lg:text-[15px] leading-relaxed whitespace-pre-wrap font-bold text-slate-300 line-clamp-4">
                  {item.content}
                </p>

                {/* 이미지 */}
                {item.images && item.images.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {item.images.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-700">
                        <img src={img.url} alt="뉴스 이미지" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {feedItems.length === 0 && (
          <div className="text-center py-20 text-slate-300 font-bold">
            등록된 뉴스가 없습니다.
          </div>
        )}
      </div>

      {/* 뉴스 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6 my-8">
            <h3 className="text-lg font-black text-white mb-6">새 뉴스 추가</h3>

            <div className="space-y-4">
              {/* 종목 검색 선택 */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-200 mb-1">종목 선택 *</label>
                {newIssue.stockId ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                    <span className="text-white text-sm font-bold">{newIssue.stockName}</span>
                    <button
                      onClick={() => setNewIssue({ ...newIssue, stockId: '', stockName: '' })}
                      className="text-slate-200 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => {
                        setStockSearch(e.target.value);
                        setShowStockDropdown(true);
                      }}
                      onFocus={() => setShowStockDropdown(true)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      placeholder="종목명 또는 티커로 검색..."
                    />
                    {showStockDropdown && (
                      <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                        {filteredStocks.length > 0 ? (
                          filteredStocks.map(stock => (
                            <button
                              key={stock.id}
                              onClick={() => handleSelectStock(stock)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                            >
                              <span className="text-white text-sm font-bold">{stock.nameKr}</span>
                              <span className="text-slate-200 text-xs ml-2">({stock.ticker})</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-slate-300 text-sm">검색 결과가 없습니다</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 제목 (필수) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="뉴스 제목을 입력하세요"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">내용 *</label>
                <textarea
                  value={newIssue.content}
                  onChange={(e) => setNewIssue({ ...newIssue, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="뉴스 내용을 입력하세요"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이미지 (선택, 여러 장 가능)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dashed border-slate-600 text-slate-200 text-sm hover:border-slate-500 hover:text-slate-300 transition-all"
                >
                  <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  클릭하여 이미지 선택
                </button>

                {/* 이미지 미리보기 */}
                {imageUploads.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {imageUploads.map((img, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700">
                        <img src={img.preview} alt="미리보기" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={img.caption}
                            onChange={(e) => handleCaptionChange(idx, e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                            placeholder="캡션 (선택)"
                          />
                          <p className="text-[10px] text-slate-300 mt-1 truncate">{img.file.name}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">키워드 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={newIssue.keywords}
                    onChange={(e) => setNewIssue({ ...newIssue, keywords: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="AI, 클라우드, 실적"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">날짜 (YY/MM/DD) *</label>
                  <input
                    type="text"
                    value={newIssue.date}
                    onChange={(e) => setNewIssue({ ...newIssue, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="25/01/29"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newIssue.isCMS}
                  onChange={(e) => setNewIssue({ ...newIssue, isCMS: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-200">CMS증권 코멘트</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeAddModal}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleAddIssue}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 뉴스 수정 모달 */}
      {showEditModal && editIssue && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6 my-8">
            <h3 className="text-lg font-black text-white mb-6">뉴스 수정</h3>

            <div className="space-y-4">
              {/* 종목 표시 (수정 불가) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">종목</label>
                <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm">
                  {editIssue.stockName}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">제목 *</label>
                <input
                  type="text"
                  value={editIssue.title}
                  onChange={(e) => setEditIssue({ ...editIssue, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="뉴스 제목을 입력하세요"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">내용 *</label>
                <textarea
                  value={editIssue.content}
                  onChange={(e) => setEditIssue({ ...editIssue, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="뉴스 내용을 입력하세요"
                />
              </div>

              {/* 기존 이미지 */}
              {editIssue.existingImages.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">기존 이미지</label>
                  <div className="grid grid-cols-3 gap-2">
                    {editIssue.existingImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-700">
                        <img src={url} alt="기존 이미지" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 추가 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">새 이미지 추가</label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dashed border-slate-600 text-slate-200 text-sm hover:border-slate-500 hover:text-slate-300 transition-all"
                >
                  <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  클릭하여 이미지 선택
                </button>

                {editImageUploads.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {editImageUploads.map((img, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700">
                        <img src={img.preview} alt="미리보기" className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-300 truncate">{img.file.name}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveEditImage(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">키워드 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={editIssue.keywords}
                    onChange={(e) => setEditIssue({ ...editIssue, keywords: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="AI, 클라우드, 실적"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">날짜 (YY/MM/DD) *</label>
                  <input
                    type="text"
                    value={editIssue.date}
                    onChange={(e) => setEditIssue({ ...editIssue, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="25/01/29"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIssue.isCMS}
                  onChange={(e) => setEditIssue({ ...editIssue, isCMS: e.target.checked })}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-200">CMS증권 코멘트</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeEditModal}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdateIssue}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isUploading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 가이드 모달 */}
      {showExcelUploadGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">뉴스 엑셀 일괄 등록</h3>
              <button
                onClick={() => setShowExcelUploadGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
                <p className="text-emerald-300 text-sm font-bold mb-2">기능 안내</p>
                <p className="text-slate-300 text-sm">엑셀 파일로 뉴스를 일괄 등록합니다. (신규 등록만, 기존 데이터 업데이트 없음)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-white text-sm font-bold mb-3">엑셀 양식</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-2 text-slate-300 font-bold">컬럼명</th>
                        <th className="text-left py-2 px-2 text-slate-300 font-bold">필수</th>
                        <th className="text-left py-2 px-2 text-slate-300 font-bold">설명</th>
                        <th className="text-left py-2 px-2 text-slate-300 font-bold">예시</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-400">
                      <tr className="border-b border-slate-700/50">
                        <td className="py-2 px-2 font-mono text-emerald-400">ticker</td>
                        <td className="py-2 px-2 text-red-400">필수</td>
                        <td className="py-2 px-2">종목 티커</td>
                        <td className="py-2 px-2 font-mono">9988.HK</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-2 px-2 font-mono text-emerald-400">title</td>
                        <td className="py-2 px-2 text-red-400">필수</td>
                        <td className="py-2 px-2">뉴스 제목</td>
                        <td className="py-2 px-2">Qwen App MAU 돌파</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-2 px-2 font-mono text-emerald-400">content</td>
                        <td className="py-2 px-2 text-red-400">필수</td>
                        <td className="py-2 px-2">뉴스 내용</td>
                        <td className="py-2 px-2">산하 Qwen App이...</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-2 px-2 font-mono text-emerald-400">date</td>
                        <td className="py-2 px-2 text-red-400">필수</td>
                        <td className="py-2 px-2">날짜 (YY/MM/DD)</td>
                        <td className="py-2 px-2 font-mono">25/01/15</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-2 px-2 font-mono text-emerald-400">is_cms</td>
                        <td className="py-2 px-2 text-slate-500">선택</td>
                        <td className="py-2 px-2">CMS 코멘트 여부</td>
                        <td className="py-2 px-2 font-mono">TRUE / FALSE</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 font-mono text-emerald-400">keywords</td>
                        <td className="py-2 px-2 text-slate-500">선택</td>
                        <td className="py-2 px-2">쉼표 구분 키워드</td>
                        <td className="py-2 px-2">AI, 클라우드</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/50">
                <p className="text-amber-300 text-sm font-bold mb-2">주의사항</p>
                <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                  <li>첫 번째 행은 반드시 헤더여야 합니다</li>
                  <li>ticker는 DB에 등록된 종목 티커와 정확히 일치해야 합니다</li>
                  <li>date는 반드시 YY/MM/DD 형식으로 입력하세요 (예: 25/01/15)</li>
                  <li>이미지는 엑셀로 업로드할 수 없습니다 (개별 편집 사용)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExcelUploadGuide(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => excelFileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
              >
                엑셀 파일 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 결과 모달 */}
      {excelUploadResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 p-6" style={{ maxWidth: '500px', width: '100%' }}>
            {excelUploadResult.errors.length > 0 && excelUploadResult.inserted === 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-red-400">업로드 실패</h3>
                </div>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {excelUploadResult.errors.map((err, i) => (
                    <p key={i} className="text-sm text-slate-300">
                      {err.row > 0 ? `행 ${err.row}: ` : ''}{err.reason}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-emerald-400">업로드 완료</h3>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-900/30">
                    <span className="text-emerald-300 text-sm">등록 완료</span>
                    <span className="text-emerald-400 text-lg font-black">{excelUploadResult.inserted}건</span>
                  </div>
                  {excelUploadResult.skipped.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-900/30">
                      <p className="text-amber-300 text-sm mb-1">스킵된 티커 (존재하지 않는 종목)</p>
                      <p className="text-amber-200 text-xs">{excelUploadResult.skipped.join(', ')}</p>
                    </div>
                  )}
                  {excelUploadResult.errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-900/30 max-h-32 overflow-y-auto">
                      <p className="text-red-300 text-sm mb-1">오류 발생</p>
                      {excelUploadResult.errors.map((err, i) => (
                        <p key={i} className="text-red-200 text-xs">행 {err.row}: {err.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <button
              onClick={() => {
                const hadInserts = excelUploadResult.inserted > 0;
                setExcelUploadResult(null);
                if (hadInserts) onRefresh();
              }}
              className="w-full py-2.5 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-600 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {showStockDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStockDropdown(false)}
        />
      )}
    </div>
  );
};

export default AdminIssuesFeed;
