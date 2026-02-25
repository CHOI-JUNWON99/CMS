import React, { useState, useRef, useMemo } from 'react';
import { Stock, SortKey, SortDirection } from '@/shared/types';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';
import { getSimplifiedSector, parseMarketCapToValue } from '@/shared/utils';
import { toast, useAdminAuthStore } from '@/shared/stores';
import * as XLSX from 'xlsx';
import {
  StockAddModal,
  ExcelUploadGuide,
  ExcelUploadResult,
  StockCard,
  NewStockData,
  UploadResult,
} from '.';
import { getIdFromTicker, parseStockExcelRows, RawStockRow } from '../utils/stockExcelParser';

interface AdminStockListProps {
  stocks: Stock[];
  onStockSelect: (stock: Stock) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onRefresh: () => void;
}

/**
 * AdminStockList 컴포넌트
 *
 * 리팩토링 후:
 * - 기존 587줄 → 약 230줄 (61% 감소)
 * - 모달들을 StockAddModal, ExcelUploadGuide, ExcelUploadResult로 분리
 * - 종목 카드를 StockCard로 분리
 */
const AdminStockList: React.FC<AdminStockListProps> = ({
  stocks,
  onStockSelect,
  sortKey,
  sortDirection,
  onSort,
  onRefresh,
}) => {
  // Admin 인증 (store 사용)
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStock, setNewStock] = useState<NewStockData>({
    ticker: '',
    name: '',
    nameKr: '',
    sector: '',
    description: '',
    marketCap: '',
    returnRate: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;
    const query = searchQuery.toLowerCase();
    return stocks.filter(s =>
      s.nameKr.toLowerCase().includes(query) ||
      s.ticker.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  const getShortSector = (sector: string) => getSimplifiedSector(sector, true);

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
      // 1행은 날짜 행이라 무시, 2행부터 헤더로 사용 (range: 1은 0-indexed로 2행부터 시작)
      const rows = XLSX.utils.sheet_to_json<RawStockRow>(sheet, { range: 1 });

      const bulkData = parseStockExcelRows(rows);

      if (bulkData.length === 0) {
        setUploadResult({ updated: 0, inserted: 0, error: '유효한 데이터가 없습니다. ticker 컬럼을 확인하세요.' });
        return;
      }

      const adminCode = getAdminCode();
      const { data: result, error } = await supabase.rpc('bulk_update_stock_metrics', {
        admin_code: adminCode,
        data: bulkData,
      });

      if (error) throw error;

      setUploadResult({
        updated: result?.updated ?? 0,
        inserted: result?.inserted ?? 0,
      });
    } catch (err: unknown) {
      console.error('엑셀 처리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '엑셀 파일 처리 중 오류가 발생했습니다.';
      setUploadResult({
        updated: 0,
        inserted: 0,
        error: errorMessage,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddStock = async () => {
    if (!newStock.ticker || !newStock.nameKr) {
      toast.warning('티커와 한글명은 필수 입력입니다.');
      return;
    }

    const stockId = getIdFromTicker(newStock.ticker);
    if (!stockId) {
      toast.warning('유효한 티커 형식이 아닙니다. (예: 002050.SZ)');
      return;
    }

    const duplicateId = stocks.find(s => s.id === stockId);
    if (duplicateId) {
      toast.warning(`이미 존재하는 종목입니다: ${duplicateId.nameKr} (${duplicateId.ticker})`);
      return;
    }

    const duplicateTicker = stocks.find(s => s.ticker.toLowerCase() === newStock.ticker.toLowerCase());
    if (duplicateTicker) {
      toast.warning(`이미 존재하는 티커입니다: ${duplicateTicker.nameKr} (${duplicateTicker.ticker})`);
      return;
    }

    try {
      const { error } = await getAdminSupabase().from('stocks').insert({
        id: stockId,
        ticker: newStock.ticker,
        name: newStock.name,
        name_kr: newStock.nameKr,
        sector: newStock.sector,
        description: newStock.description,
        market_cap: newStock.marketCap,
        market_cap_value: parseMarketCapToValue(newStock.marketCap),
        return_rate: newStock.returnRate,
        keywords: [],
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewStock({ ticker: '', name: '', nameKr: '', sector: '', description: '', marketCap: '', returnRate: 0 });
      onRefresh();
      toast.success('종목이 추가되었습니다.');
    } catch (err) {
      console.error('종목 추가 실패:', err);
      toast.error('종목 추가에 실패했습니다.');
    }
  };

  const handleUploadResultClose = () => {
    const hasError = uploadResult?.error;
    setUploadResult(null);
    if (!hasError) {
      onRefresh();
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
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-600"
        />
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-slate-300">정렬</span>
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
                  : 'bg-slate-800/50 text-slate-300 hover:text-slate-300 hover:bg-slate-800'
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
          <p className="text-slate-300 font-bold">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 종목이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onClick={() => onStockSelect(stock)}
              getShortSector={getShortSector}
            />
          ))}
        </div>
      )}

      {/* 모달들 */}
      <StockAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStock}
        newStock={newStock}
        onNewStockChange={setNewStock}
        getIdFromTicker={getIdFromTicker}
      />

      <ExcelUploadGuide
        isOpen={showUploadGuide}
        onClose={() => setShowUploadGuide(false)}
        onSelectFile={() => fileInputRef.current?.click()}
      />

      <ExcelUploadResult
        result={uploadResult}
        onClose={handleUploadResultClose}
      />
    </div>
  );
};

export default AdminStockList;
