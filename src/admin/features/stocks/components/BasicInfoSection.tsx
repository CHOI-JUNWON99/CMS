import React, { useState } from 'react';
import { getAdminSupabase } from '@/shared/lib/supabase';
import { toast, confirm } from '@/shared/stores';
import { Stock } from '@/shared/types';

interface Props {
  stock: Stock;
  onRefresh: () => void;
  onBack: () => void;
}

const BasicInfoSection: React.FC<Props> = ({ stock, onRefresh, onBack }) => {
  const [editingStock, setEditingStock] = useState({
    ...stock,
    tickers: (stock.tickers && stock.tickers.length > 0) ? stock.tickers : [stock.ticker],  // 복수 티커 초기화
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [editingTickerIdx, setEditingTickerIdx] = useState<number | null>(null);
  const [editingTickerValue, setEditingTickerValue] = useState('');

  const handleSaveBasicInfo = async () => {
    setIsSaving(true);
    try {
      // tickers가 2개 이상이면 배열 저장, 1개면 빈 배열로 저장 (ticker만 사용)
      const tickersToSave = (editingStock.tickers && editingStock.tickers.length > 1)
        ? editingStock.tickers
        : [];

      const { data, error } = await getAdminSupabase()
        .from('stocks')
        .update({
          name: editingStock.name,
          name_kr: editingStock.nameKr,
          ticker: editingStock.tickers?.[0] || editingStock.ticker,  // 기본 티커
          tickers: tickersToSave,  // 2개 이상일 때만 배열 저장
          sector: editingStock.sector,
          description: editingStock.description,
          market_cap: editingStock.marketCap,
          return_rate: editingStock.returnRate,
          per: editingStock.per,
          pbr: editingStock.pbr,
          psr: editingStock.psr,
          keywords: editingStock.keywords,
          last_update: new Date().toISOString(),
        })
        .eq('id', stock.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('저장 실패: 권한이 없습니다. 관리자 코드를 확인해주세요.');
        return;
      }
      onRefresh();
      toast.success('저장되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('저장 실패: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStock = async () => {
    const confirmed = await confirm.custom({
      title: '종목 삭제',
      message: '정말 이 종목을 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.',
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      // 관련 데이터 먼저 삭제
      await getAdminSupabase().from('investment_points').delete().eq('stock_id', stock.id);
      await getAdminSupabase().from('business_segments').delete().eq('stock_id', stock.id);

      // issues의 이미지 먼저 삭제
      const { data: issueIds } = await getAdminSupabase()
        .from('issues')
        .select('id')
        .eq('stock_id', stock.id);
      if (issueIds) {
        for (const issue of issueIds) {
          await getAdminSupabase().from('issue_images').delete().eq('issue_id', issue.id);
        }
      }
      await getAdminSupabase().from('issues').delete().eq('stock_id', stock.id);

      // 종목 삭제
      const { error } = await getAdminSupabase().from('stocks').delete().eq('id', stock.id);
      if (error) throw error;

      toast.success('삭제되었습니다.');
      onBack();
    } catch (err) {
      console.error(err);
      toast.error('삭제 실패');
    }
  };

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-white">{stock.nameKr} 수정</h2>
            <span className="text-sm text-slate-300 font-mono">{stock.ticker}</span>
          </div>
        </div>
        <button
          onClick={handleDeleteStock}
          className="px-4 py-2 rounded-lg bg-red-900/50 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/70 transition-all"
        >
          종목 삭제
        </button>
      </div>

      {/* 기본 정보 섹션 */}
      <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-black text-red-400 mb-4 tracking-wider">기본 정보</h3>

        {/* 티커 편집 영역 */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <label className="block text-xs font-bold text-slate-200 mb-2">티커는 클릭하여 수정 가능하며 복수 등록 가능합니다.(2개 이상일때만 삭제 버튼 'X'가 표시됩니다)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {editingStock.tickers?.map((ticker, idx) => (
              <div key={idx} className="inline-flex items-center">
                {editingTickerIdx === idx ? (
                  // 편집 모드
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={editingTickerValue}
                      onChange={(e) => setEditingTickerValue(e.target.value.toUpperCase())}
                      className="w-28 px-2 py-1 rounded-lg bg-slate-900 border border-blue-500 text-blue-300 text-sm font-mono font-bold focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = editingTickerValue.trim();
                          if (trimmed) {
                            const newTickers = [...(editingStock.tickers || [])];
                            newTickers[idx] = trimmed;
                            setEditingStock({ ...editingStock, tickers: newTickers, ticker: newTickers[0] });
                          }
                          setEditingTickerIdx(null);
                        } else if (e.key === 'Escape') {
                          setEditingTickerIdx(null);
                        }
                      }}
                      onBlur={() => {
                        const trimmed = editingTickerValue.trim();
                        if (trimmed) {
                          const newTickers = [...(editingStock.tickers || [])];
                          newTickers[idx] = trimmed;
                          setEditingStock({ ...editingStock, tickers: newTickers, ticker: newTickers[0] });
                        }
                        setEditingTickerIdx(null);
                      }}
                    />
                  </div>
                ) : (
                  // 표시 모드
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/50 border border-blue-700 text-blue-300 text-sm font-mono font-bold group">
                    <button
                      onClick={() => {
                        setEditingTickerIdx(idx);
                        setEditingTickerValue(ticker);
                      }}
                      className="hover:text-white transition-colors"
                      title="클릭하여 수정"
                    >
                      {ticker}
                    </button>
                    {editingStock.tickers && editingStock.tickers.length > 1 && (
                      <button
                        onClick={() => {
                          const newTickers = editingStock.tickers?.filter((_, i) => i !== idx) || [];
                          setEditingStock({ ...editingStock, tickers: newTickers, ticker: newTickers[0] });
                        }}
                        className="ml-1 text-blue-400 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              placeholder="새 티커 입력 (예: 9988.HK)"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTicker.trim()) {
                  e.preventDefault();
                  const trimmed = newTicker.trim();
                  if (!editingStock.tickers?.includes(trimmed)) {
                    setEditingStock({
                      ...editingStock,
                      tickers: [...(editingStock.tickers || []), trimmed],
                    });
                  }
                  setNewTicker('');
                }
              }}
            />
            <button
              onClick={() => {
                const trimmed = newTicker.trim();
                if (trimmed && !editingStock.tickers?.includes(trimmed)) {
                  setEditingStock({
                    ...editingStock,
                    tickers: [...(editingStock.tickers || []), trimmed],
                  });
                }
                setNewTicker('');
              }}
              disabled={!newTicker.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              추가
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">한글명 (Enter로 줄바꿈 가능)</label>
            <textarea
              value={editingStock.nameKr}
              onChange={(e) => setEditingStock({ ...editingStock, nameKr: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
              placeholder="부사강산업&#10;인터넷"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">영문명</label>
            <input
              type="text"
              value={editingStock.name}
              onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">섹터</label>
            <input
              type="text"
              value={editingStock.sector}
              onChange={(e) => setEditingStock({ ...editingStock, sector: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">시가총액</label>
            <input
              type="text"
              value={editingStock.marketCap}
              onChange={(e) => setEditingStock({ ...editingStock, marketCap: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              placeholder="542조 4,068억원"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">수익률 (%)</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.returnRate || ''}
              onChange={(e) =>
                setEditingStock({ ...editingStock, returnRate: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">PER</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.per || ''}
              onChange={(e) => setEditingStock({ ...editingStock, per: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">PBR</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.pbr || ''}
              onChange={(e) => setEditingStock({ ...editingStock, pbr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">PSR</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.psr || ''}
              onChange={(e) => setEditingStock({ ...editingStock, psr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-200 mb-1">
            키워드 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={editingStock.keywords?.join(', ') || ''}
            onChange={(e) =>
              setEditingStock({
                ...editingStock,
                keywords: e.target.value
                  .split(',')
                  .map(k => k.trim())
                  .filter(k => k),
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-200 mb-1">핵심 비즈니스 개요</label>
          <textarea
            value={editingStock.description || ''}
            onChange={(e) => setEditingStock({ ...editingStock, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveBasicInfo}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-black hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '기본정보 저장'}
          </button>
        </div>
      </section>
    </>
  );
};

export default BasicInfoSection;
