import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { adminAction } from '@/shared/lib/adminApi';
import { DbIBOpinionRow } from '@/shared/types';
import { parseIBExcel, IBExcelRow } from './utils/ibExcelParser';
import IBExcelUploadModal from './components/IBExcelUploadModal';

const isProd = import.meta.env.PROD;

const AdminIBPage: React.FC = () => {
  const [opinions, setOpinions] = useState<DbIBOpinionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    errors: { row: number; reason: string }[];
    duplicates: { row: number; firstRow: number; key: string }[];
  } | null>(null);

  const fetchOpinions = useCallback(async () => {
    setIsLoading(true);
    // Supabase 기본 limit은 1000이므로 페이징으로 전체 조회
    const allData: DbIBOpinionRow[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('ib_opinions')
        .select('*')
        .order('date', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error || !data) break;
      allData.push(...(data as DbIBOpinionRow[]));
      hasMore = data.length === pageSize;
      from += pageSize;
    }

    setOpinions(allData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  const bulkInsert = async (rows: IBExcelRow[]): Promise<number> => {
    if (isProd) {
      const batchSize = 500;
      let totalInserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const result = await adminAction<{ success: boolean; inserted: number }>('bulk_insert_ib_opinions', {
          data: batch as unknown as Record<string, unknown>[],
        });
        totalInserted += result.inserted;
      }
      return totalInserted;
    } else {
      // 로컬: Supabase 직접 호출 (배치 처리)
      const batchSize = 500;
      let totalInserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data: inserted, error } = await supabase
          .from('ib_opinions')
          .insert(batch)
          .select('id');
        if (error) throw error;
        totalInserted += inserted?.length || 0;
      }
      return totalInserted;
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseIBExcel(buffer);

      if (parsed.rows.length === 0) {
        setUploadResult({ inserted: 0, errors: parsed.errors, duplicates: parsed.duplicates });
        setIsUploading(false);
        return;
      }

      const totalInserted = await bulkInsert(parsed.rows);
      setUploadResult({ inserted: totalInserted, errors: parsed.errors, duplicates: parsed.duplicates });
      fetchOpinions();
    } catch (err) {
      setUploadResult({ inserted: 0, errors: [{ row: 0, reason: String(err) }], duplicates: [] });
    }
    setIsUploading(false);
  };

  const handleDeleteByDate = async (date: string) => {
    if (!confirm(`${date} 날짜의 모든 IB 데이터를 삭제하시겠습니까?`)) return;

    try {
      if (isProd) {
        await adminAction('delete_ib_opinions_by_date', { date });
      } else {
        const { error } = await supabase.from('ib_opinions').delete().eq('date', date);
        if (error) throw error;
      }
      fetchOpinions();
    } catch (err) {
      console.error('날짜별 삭제 실패:', err);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      if (isProd) {
        await adminAction('delete_ib_opinion', { opinionId: id });
      } else {
        const { error } = await supabase.from('ib_opinions').delete().eq('id', id);
        if (error) throw error;
      }
      setOpinions((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('개별 삭제 실패:', err);
    }
  };

  // Group by date
  const groupedByDate = opinions.reduce<Record<string, DbIBOpinionRow[]>>((acc, op) => {
    const d = op.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(op);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">IB 투자의견 관리</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {isUploading ? '업로드 중...' : '엑셀 업로드'}
        </button>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`p-4 rounded-xl border ${uploadResult.inserted > 0 ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-sm font-bold ${uploadResult.inserted > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                등록: {uploadResult.inserted}건
              </span>
              {uploadResult.duplicates.length > 0 && (
                <span className="text-amber-400 text-sm ml-3">중복 스킵: {uploadResult.duplicates.length}건</span>
              )}
              {uploadResult.errors.length > 0 && (
                <span className="text-red-400 text-sm ml-3">오류: {uploadResult.errors.length}건</span>
              )}
            </div>
            <button onClick={() => setUploadResult(null)} className="text-slate-400 hover:text-white text-sm">닫기</button>
          </div>
          {uploadResult.duplicates.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
              <p className="text-amber-300 text-xs font-bold mb-1">중복 스킵 상세 (Ticker|날짜|IB|애널리스트)</p>
              <div className="max-h-32 overflow-y-auto text-xs text-amber-200/80 space-y-0.5">
                {uploadResult.duplicates.map((d, i) => {
                  const [ticker, date, ib, analyst] = d.key.split('|');
                  return (
                    <div key={i}>
                      행 {d.row} → 행 {d.firstRow}과 중복: {ticker} / {date} / {ib}{analyst ? ` / ${analyst}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {uploadResult.errors.length > 0 && (
            <div className="mt-2 max-h-24 overflow-y-auto text-xs text-red-300">
              {uploadResult.errors.slice(0, 10).map((e, i) => (
                <div key={i}>{e.row > 0 ? `행 ${e.row}: ` : ''}{e.reason}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4">
        <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <span className="text-slate-400 text-xs">총 데이터</span>
          <div className="text-white text-lg font-black">{opinions.length}건</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <span className="text-slate-400 text-xs">날짜 수</span>
          <div className="text-white text-lg font-black">{sortedDates.length}일</div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 text-slate-500">데이터가 없습니다. 엑셀을 업로드해주세요.</div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50">
                <span className="text-white font-bold text-sm">{date} ({groupedByDate[date].length}건)</span>
                <button
                  onClick={() => handleDeleteByDate(date)}
                  className="text-red-400 text-xs font-bold hover:text-red-300 transition-colors"
                >
                  날짜 전체 삭제
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-2 px-2 text-left">종목명</th>
                      <th className="py-2 px-2 text-left">Ticker</th>
                      <th className="py-2 px-2 text-left">Sector</th>
                      <th className="py-2 px-2 text-left">IB</th>
                      <th className="py-2 px-2 text-left">투자의견</th>
                      <th className="py-2 px-2 text-right">기존주가</th>
                      <th className="py-2 px-2 text-right">목표주가</th>
                      <th className="py-2 px-2 text-right">목표가변화</th>
                      <th className="py-2 px-2 text-left truncate max-w-[200px]">코멘트</th>
                      <th className="py-2 px-2 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByDate[date].map((op) => (
                      <tr key={op.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/30">
                        <td className="py-2 px-2">{op.stock_name}</td>
                        <td className="py-2 px-2 font-mono text-primary-accent">{op.ticker}</td>
                        <td className="py-2 px-2">{op.sector || '-'}</td>
                        <td className="py-2 px-2">{op.ib}</td>
                        <td className="py-2 px-2">{op.opinion || '-'}</td>
                        <td className="py-2 px-2 text-right">{op.prev_price || '-'}</td>
                        <td className="py-2 px-2 text-right">{op.target_price || '-'}</td>
                        <td className="py-2 px-2 text-right">
                          {op.target_change != null ? `${(op.target_change * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 px-2 truncate max-w-[200px]" title={op.comment || ''}>
                          {op.comment || '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button onClick={() => handleDeleteOne(op.id)} className="text-red-500 hover:text-red-300">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <IBExcelUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onFileSelect={handleFileSelect} />
    </div>
  );
};

export default AdminIBPage;
