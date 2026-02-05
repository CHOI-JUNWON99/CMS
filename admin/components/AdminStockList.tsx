import React, { useState, useRef, useMemo } from 'react';
import { Stock, SortKey, SortDirection } from '../../types';
import { supabase, getAdminSupabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface AdminStockListProps {
  stocks: Stock[];
  onStockSelect: (stock: Stock) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onRefresh: () => void;
}

const AdminStockList: React.FC<AdminStockListProps> = ({
  stocks,
  onStockSelect,
  sortKey,
  sortDirection,
  onSort,
  onRefresh,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    updated: number;
    skipped: string[];
    error?: string;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStock, setNewStock] = useState({
    id: '',
    ticker: '',
    name: '',
    nameKr: '',
    sector: '',
    description: '',
    marketCap: '',
    returnRate: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 검색 필터링
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const query = searchQuery.toLowerCase();
    return stocks.filter(s =>
      s.nameKr.toLowerCase().includes(query) ||
      s.ticker.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  const getSimplifiedSector = (sector: string) => {
    if (sector.includes('반도체')) return '반도체';
    if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
    if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재';
    if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
    if (sector.includes('온라인') || sector.includes('서비스')) return '서비스';
    if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷')) return 'IT';
    return sector;
  };

  // 엑셀 업로드 처리 (Bulk API 사용)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    setShowUploadGuide(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{
        ticker?: string;
        marketCap?: string;
        totalReturn?: number;
        PER?: number;
        PBR?: number;
        PSR?: number;
      }>(sheet);

      // 엑셀 데이터를 RPC 함수용 JSON 배열로 변환
      const bulkData = rows
        .filter(row => row.ticker) // ticker가 있는 행만
        .map(row => ({
          ticker: row.ticker,
          market_cap: row.marketCap || null,
          return_rate: row.totalReturn ?? null,
          per: row.PER ?? null,
          pbr: row.PBR ?? null,
          psr: row.PSR ?? null,
        }));

      if (bulkData.length === 0) {
        setUploadResult({ updated: 0, skipped: [], error: '유효한 데이터가 없습니다. ticker 컬럼을 확인하세요.' });
        return;
      }

      // RPC 함수 1회 호출로 일괄 업데이트
      const adminCode = localStorage.getItem('cms_admin_code') || '';
      const { data: result, error } = await supabase.rpc('bulk_update_stock_metrics', {
        admin_code: adminCode,
        data: bulkData,
      });

      if (error) {
        throw error;
      }

      setUploadResult({
        updated: result?.updated ?? 0,
        skipped: result?.skipped ?? [],
      });
    } catch (err: any) {
      console.error('엑셀 처리 오류:', err);
      setUploadResult({
        updated: 0,
        skipped: [],
        error: err.message || '엑셀 파일 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 종목 추가
  const handleAddStock = async () => {
    if (!newStock.id || !newStock.nameKr) return;

    try {
      const { error } = await getAdminSupabase().from('stocks').insert({
        id: newStock.id,
        ticker: newStock.ticker,
        name: newStock.name,
        name_kr: newStock.nameKr,
        sector: newStock.sector,
        description: newStock.description,
        market_cap: newStock.marketCap,
        return_rate: newStock.returnRate,
        keywords: [],
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewStock({ id: '', ticker: '', name: '', nameKr: '', sector: '', description: '', marketCap: '', returnRate: 0 });
      onRefresh();
    } catch (err) {
      console.error('종목 추가 실패:', err);
      alert('종목 추가에 실패했습니다.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* 액션 버튼들 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">
          종목 관리 ({searchQuery ? `${filteredStocks.length}/${stocks.length}` : stocks.length}개)
        </h2>
        <div className="flex items-center gap-3">
          {/* 엑셀 업로드 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          <button
            onClick={() => setShowUploadGuide(true)}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-slate-700 text-emerald-400 text-xs font-black hover:bg-emerald-900/50 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? '업로드 중...' : '엑셀 일괄 업데이트'}
          </button>

          {/* 종목 추가 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            종목 추가
          </button>
        </div>
      </div>


      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="종목명 또는 티커로 검색..."
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
        />
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-slate-500">정렬</span>
        <div className="flex gap-2">
          {[
            { key: 'name' as SortKey, label: '이름' },
            { key: 'sector' as SortKey, label: '섹터' },
            { key: 'marketCapValue' as SortKey, label: '시총' },
            { key: 'returnRate' as SortKey, label: '수익률' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onSort(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortKey === key
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label}
              {sortKey === key && (
                <span className="ml-1">{sortDirection === 'ASC' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 종목 카드 그리드 */}
      {filteredStocks.length === 0 ? (
        <div className="text-center py-20 rounded-xl bg-slate-900/30 border border-slate-800">
          <p className="text-slate-500 font-bold">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 종목이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStocks.map((stock) => (
            <div
              key={stock.id}
              onClick={() => onStockSelect(stock)}
              className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#112240] border border-slate-800 hover:border-slate-600 hover:bg-[#1a2d4d] transition-all cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white truncate">{stock.nameKr}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 flex-shrink-0">
                    {stock.ticker}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 px-1.5 py-0.5 rounded bg-slate-800/50">
                    {getSimplifiedSector(stock.sector)}
                  </span>
                  <span className="text-slate-500">{stock.marketCap || '-'}</span>
                  <span className={`font-bold ${(stock.returnRate ?? 0) >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                    {(stock.returnRate ?? 0) >= 0 ? '+' : ''}{(stock.returnRate ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* 종목 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
            <h3 className="text-lg font-black text-white mb-6">새 종목 추가</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">종목 ID *</label>
                  <input
                    type="text"
                    value={newStock.id}
                    onChange={(e) => setNewStock({ ...newStock, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="002050"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">티커</label>
                  <input
                    type="text"
                    value={newStock.ticker}
                    onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="002050.SZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">영문명</label>
                  <input
                    type="text"
                    value={newStock.name}
                    onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">한글명 *</label>
                  <input
                    type="text"
                    value={newStock.nameKr}
                    onChange={(e) => setNewStock({ ...newStock, nameKr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="종목명"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">섹터</label>
                <input
                  type="text"
                  value={newStock.sector}
                  onChange={(e) => setNewStock({ ...newStock, sector: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="자동차 부품"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">기업 설명</label>
                <textarea
                  value={newStock.description}
                  onChange={(e) => setNewStock({ ...newStock, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="기업 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">시가총액</label>
                  <input
                    type="text"
                    value={newStock.marketCap}
                    onChange={(e) => setNewStock({ ...newStock, marketCap: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="43조 5,892억원"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">수익률 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStock.returnRate || ''}
                    onChange={(e) => setNewStock({ ...newStock, returnRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddStock}
                disabled={!newStock.id || !newStock.nameKr}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 안내 모달 */}
      {showUploadGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full p-6" style={{ maxWidth: '540px' }}>
            <h3 className="text-lg font-black text-white mb-4">엑셀 일괄 업데이트</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50">
                <p className="text-amber-400 text-sm font-bold mb-2">주의사항</p>
                <ul className="text-amber-200/80 text-xs space-y-1 list-disc list-inside">
                  <li>첫 번째 행은 반드시 헤더여야 합니다</li>
                  <li>ticker 컬럼은 필수입니다 (DB에 있는 ticker와 정확히 일치해야 함)</li>
                  <li>빈 셀은 기존 값을 유지합니다</li>
                  <li>DB에 없는 ticker는 무시됩니다</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-slate-300 text-sm font-bold mb-3">엑셀 양식</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-2 text-emerald-400 font-mono">ticker</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-mono">marketCap</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-mono">totalReturn</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-mono">PER</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-mono">PBR</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-mono">PSR</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-500">
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2">AAPL</td>
                        <td className="py-2 px-2">35조 3,500억원</td>
                        <td className="py-2 px-2">25.3</td>
                        <td className="py-2 px-2">28.5</td>
                        <td className="py-2 px-2">45.2</td>
                        <td className="py-2 px-2">7.8</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">005930.KS</td>
                        <td className="py-2 px-2">350조</td>
                        <td className="py-2 px-2">-5.2</td>
                        <td className="py-2 px-2">12.1</td>
                        <td className="py-2 px-2">1.5</td>
                        <td className="py-2 px-2">2.3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadGuide(false)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
              >
                엑셀 파일 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 결과 모달 */}
      {uploadResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 p-6" style={{ maxWidth: '400px', width: '100%' }}>
            {uploadResult.error ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-red-400">업로드 실패</h3>
                </div>
                <p className="text-slate-300 text-sm mb-6">{uploadResult.error}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-emerald-400">업데이트 완료</h3>
                </div>
                <p className="text-white text-2xl font-black mb-2">
                  {uploadResult.updated}개 종목
                </p>
                <p className="text-slate-400 text-sm mb-4">성공적으로 업데이트되었습니다.</p>
                {uploadResult.skipped.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/50 mb-4">
                    <p className="text-amber-400 text-sm font-bold mb-1">
                      {uploadResult.skipped.length}개 종목 무시됨
                    </p>
                    <p className="text-amber-200/70 text-xs">DB에 없는 ticker:</p>
                    <p className="text-amber-300/80 text-xs font-mono mt-1">
                      {uploadResult.skipped.join(', ')}
                    </p>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => {
                setUploadResult(null);
                if (!uploadResult.error) {
                  onRefresh();
                }
              }}
              className="w-full py-2.5 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-600 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStockList;
