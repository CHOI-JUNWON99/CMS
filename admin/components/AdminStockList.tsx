import React, { useState, useRef } from 'react';
import { Stock, SortKey, SortDirection } from '../../types';
import { getAdminSupabase } from '../../lib/supabase';
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
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStock, setNewStock] = useState({
    id: '',
    ticker: '',
    name: '',
    nameKr: '',
    sector: '',
    description: '',
    marketCap: '',
    marketCapValue: 0,
    price: 0,
    change: 0,
    returnRate: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSimplifiedSector = (sector: string) => {
    if (sector.includes('반도체')) return '반도체';
    if (sector.includes('자동차') || sector.includes('트럭')) return '자동차';
    if (sector.includes('기계') || sector.includes('장비') || sector.includes('자동화')) return '산업재';
    if (sector.includes('제약') || sector.includes('생명 공학')) return '바이오';
    if (sector.includes('온라인') || sector.includes('서비스')) return '서비스';
    if (sector.includes('전기') || sector.includes('통신') || sector.includes('인터넷')) return 'IT';
    return sector;
  };

  const formatMarketCap = (value: number) => {
    if (value >= 10000) return `${Math.floor(value / 10000).toLocaleString()}조`;
    return `${value.toLocaleString()}억`;
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
    <svg className={`w-3 h-3 transition-all ${active ? 'text-red-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
      {direction === 'ASC' ? (
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      )}
    </svg>
  );

  // 엑셀 업로드 처리
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{ id?: string; stock_id?: string; ticker?: string; return_rate?: number; returnRate?: number }>(sheet);

      let success = 0;
      let failed = 0;

      for (const row of rows) {
        const stockId = row.id || row.stock_id || row.ticker?.split('.')[0];
        const returnRate = row.return_rate ?? row.returnRate;

        if (stockId && typeof returnRate === 'number') {
          const { error } = await getAdminSupabase()
            .from('stocks')
            .update({ return_rate: returnRate })
            .eq('id', stockId);

          if (error) {
            failed++;
          } else {
            success++;
          }
        } else {
          failed++;
        }
      }

      setUploadResult({ success, failed });
      onRefresh();
    } catch (err) {
      console.error('엑셀 처리 오류:', err);
      setUploadResult({ success: 0, failed: -1 });
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
        market_cap_value: newStock.marketCapValue,
        price: newStock.price,
        change: newStock.change,
        return_rate: newStock.returnRate,
        keywords: [],
        views: 0,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewStock({ id: '', ticker: '', name: '', nameKr: '', sector: '', description: '', marketCap: '', marketCapValue: 0, price: 0, change: 0, returnRate: 0 });
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
        <h2 className="text-lg font-black text-white">종목 관리 ({stocks.length}개)</h2>
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-black hover:bg-emerald-900/50 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? '업로드 중...' : '엑셀 수익률 업데이트'}
          </button>

          {/* 종목 추가 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            종목 추가
          </button>
        </div>
      </div>

      {/* 업로드 결과 */}
      {uploadResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-bold ${uploadResult.failed === -1 ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
          {uploadResult.failed === -1
            ? '엑셀 파일 처리 중 오류가 발생했습니다.'
            : `업데이트 완료: 성공 ${uploadResult.success}건, 실패 ${uploadResult.failed}건`}
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800">
              <th className="text-left px-4 py-3">
                <button onClick={() => onSort('name')} className="flex items-center gap-1 text-[11px] font-black tracking-wider text-slate-400 hover:text-white">
                  종목명 <SortIcon active={sortKey === 'name'} direction={sortDirection} />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => onSort('sector')} className="flex items-center gap-1 text-[11px] font-black tracking-wider text-slate-400 hover:text-white">
                  섹터 <SortIcon active={sortKey === 'sector'} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button onClick={() => onSort('marketCapValue')} className="flex items-center gap-1 text-[11px] font-black tracking-wider text-slate-400 hover:text-white ml-auto">
                  시가총액 <SortIcon active={sortKey === 'marketCapValue'} direction={sortDirection} />
                </button>
              </th>
              <th className="text-right px-4 py-3">
                <button onClick={() => onSort('change')} className="flex items-center gap-1 text-[11px] font-black tracking-wider text-slate-400 hover:text-white ml-auto">
                  수익률 <SortIcon active={sortKey === 'change'} direction={sortDirection} />
                </button>
              </th>
              <th className="text-center px-4 py-3">
                <span className="text-[11px] font-black tracking-wider text-slate-400">관리</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.id}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-white">{stock.nameKr}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{stock.ticker}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-slate-400 px-2 py-1 rounded bg-slate-800">
                    {getSimplifiedSector(stock.sector)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-black text-slate-300">{formatMarketCap(stock.marketCapValue)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={`font-black ${stock.returnRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {stock.returnRate >= 0 ? '+' : ''}{stock.returnRate?.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => onStockSelect(stock)}
                    className="px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <label className="block text-xs font-bold text-slate-400 mb-1">시가총액 (표시용)</label>
                  <input
                    type="text"
                    value={newStock.marketCap}
                    onChange={(e) => setNewStock({ ...newStock, marketCap: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="43조 5,892억원"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">시가총액 (억원)</label>
                  <input
                    type="number"
                    value={newStock.marketCapValue || ''}
                    onChange={(e) => setNewStock({ ...newStock, marketCapValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="435892"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">현재가</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStock.price || ''}
                    onChange={(e) => setNewStock({ ...newStock, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">등락률 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStock.change || ''}
                    onChange={(e) => setNewStock({ ...newStock, change: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
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
    </div>
  );
};

export default AdminStockList;
