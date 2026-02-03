import React, { useState } from 'react';
import { Stock } from '../types';
import { getAdminSupabase } from '../lib/supabase';

interface AdminStockDetailProps {
  stock: Stock;
  onBack: () => void;
  onRefresh: () => void;
}

const AdminStockDetail: React.FC<AdminStockDetailProps> = ({ stock, onBack, onRefresh }) => {
  const [editingStock, setEditingStock] = useState({ ...stock });
  const [isSaving, setIsSaving] = useState(false);

  // 투자포인트 상태
  const [investmentPoints, setInvestmentPoints] = useState(stock.investmentPoints || []);
  const [showAddPoint, setShowAddPoint] = useState(false);
  const [newPoint, setNewPoint] = useState({ title: '', description: '' });

  // 사업부문 상태
  const [businessSegments, setBusinessSegments] = useState(stock.businessSegments || []);
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: '', nameKr: '', value: 0, color: 'bg-blue-500' });

  // 이슈 상태
  const [issues, setIssues] = useState(stock.issues || []);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', content: '', keywords: '', date: '', isCMS: false });

  // 기본 정보 저장
  const handleSaveBasicInfo = async () => {
    setIsSaving(true);
    try {
      const { error } = await getAdminSupabase().from('stocks').update({
        name: editingStock.name,
        name_kr: editingStock.nameKr,
        ticker: editingStock.ticker,
        sector: editingStock.sector,
        description: editingStock.description,
        market_cap: editingStock.marketCap,
        market_cap_value: editingStock.marketCapValue,
        price: editingStock.price,
        change: editingStock.change,
        return_rate: editingStock.returnRate,
        per: editingStock.per,
        pbr: editingStock.pbr,
        psr: editingStock.psr,
        keywords: editingStock.keywords,
      }).eq('id', stock.id);

      if (error) throw error;
      alert('저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  // 종목 삭제
  const handleDeleteStock = async () => {
    if (!confirm('정말 이 종목을 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) return;

    try {
      // 관련 데이터 먼저 삭제
      await getAdminSupabase().from('investment_points').delete().eq('stock_id', stock.id);
      await getAdminSupabase().from('business_segments').delete().eq('stock_id', stock.id);

      // issues의 이미지 먼저 삭제
      const { data: issueIds } = await getAdminSupabase().from('issues').select('id').eq('stock_id', stock.id);
      if (issueIds) {
        for (const issue of issueIds) {
          await getAdminSupabase().from('issue_images').delete().eq('issue_id', issue.id);
        }
      }
      await getAdminSupabase().from('issues').delete().eq('stock_id', stock.id);

      // 종목 삭제
      const { error } = await getAdminSupabase().from('stocks').delete().eq('id', stock.id);
      if (error) throw error;

      alert('삭제되었습니다.');
      onBack();
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  // 투자포인트 추가
  const handleAddPoint = async () => {
    if (!newPoint.title) return;
    try {
      const { error } = await getAdminSupabase().from('investment_points').insert({
        stock_id: stock.id,
        title: newPoint.title,
        description: newPoint.description,
        sort_order: investmentPoints.length,
      });
      if (error) throw error;
      setInvestmentPoints([...investmentPoints, { ...newPoint, id: Date.now() } as any]);
      setNewPoint({ title: '', description: '' });
      setShowAddPoint(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('추가 실패');
    }
  };

  // 투자포인트 삭제
  const handleDeletePoint = async (pointId: any) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await getAdminSupabase().from('investment_points').delete().eq('id', pointId);
      if (error) throw error;
      setInvestmentPoints(investmentPoints.filter((p: any) => p.id !== pointId));
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  // 사업부문 추가
  const handleAddSegment = async () => {
    if (!newSegment.nameKr) return;
    try {
      const { error } = await getAdminSupabase().from('business_segments').insert({
        stock_id: stock.id,
        name: newSegment.name,
        name_kr: newSegment.nameKr,
        value: newSegment.value,
        color: newSegment.color,
        sort_order: businessSegments.length,
      });
      if (error) throw error;
      setBusinessSegments([...businessSegments, { ...newSegment, id: Date.now() } as any]);
      setNewSegment({ name: '', nameKr: '', value: 0, color: 'bg-blue-500' });
      setShowAddSegment(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('추가 실패');
    }
  };

  // 사업부문 삭제
  const handleDeleteSegment = async (segmentId: any) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const { error } = await getAdminSupabase().from('business_segments').delete().eq('id', segmentId);
      if (error) throw error;
      setBusinessSegments(businessSegments.filter((s: any) => s.id !== segmentId));
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  // 이슈 추가
  const handleAddIssue = async () => {
    if (!newIssue.content || !newIssue.date) return;
    try {
      const { error } = await getAdminSupabase().from('issues').insert({
        stock_id: stock.id,
        title: newIssue.title || null,
        content: newIssue.content,
        keywords: newIssue.keywords.split(',').map(k => k.trim()).filter(k => k),
        date: newIssue.date,
        is_cms: newIssue.isCMS,
      });
      if (error) throw error;
      setIssues([{ ...newIssue, keywords: newIssue.keywords.split(',').map(k => k.trim()).filter(k => k), id: Date.now() } as any, ...issues]);
      setNewIssue({ title: '', content: '', keywords: '', date: '', isCMS: false });
      setShowAddIssue(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('추가 실패');
    }
  };

  // 이슈 삭제
  const handleDeleteIssue = async (issueId: any) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await getAdminSupabase().from('issue_images').delete().eq('issue_id', issueId);
      const { error } = await getAdminSupabase().from('issues').delete().eq('id', issueId);
      if (error) throw error;
      setIssues(issues.filter((i: any) => i.id !== issueId));
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  const colorOptions = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-pink-500', 'bg-slate-500'];

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-white">{stock.nameKr} 수정</h2>
            <span className="text-sm text-slate-500 font-mono">{stock.ticker}</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">한글명</label>
            <input
              type="text"
              value={editingStock.nameKr}
              onChange={(e) => setEditingStock({ ...editingStock, nameKr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">영문명</label>
            <input
              type="text"
              value={editingStock.name}
              onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">섹터</label>
            <input
              type="text"
              value={editingStock.sector}
              onChange={(e) => setEditingStock({ ...editingStock, sector: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">시가총액 (표시)</label>
            <input
              type="text"
              value={editingStock.marketCap}
              onChange={(e) => setEditingStock({ ...editingStock, marketCap: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">시총 (억원)</label>
            <input
              type="number"
              value={editingStock.marketCapValue || ''}
              onChange={(e) => setEditingStock({ ...editingStock, marketCapValue: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">수익률 (%)</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.returnRate || ''}
              onChange={(e) => setEditingStock({ ...editingStock, returnRate: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">현재가</label>
            <input
              type="number"
              step="0.01"
              value={editingStock.price || ''}
              onChange={(e) => setEditingStock({ ...editingStock, price: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">등락률 (%)</label>
            <input
              type="number"
              step="0.01"
              value={editingStock.change || ''}
              onChange={(e) => setEditingStock({ ...editingStock, change: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">PER</label>
            <input
              type="number"
              step="0.1"
              value={editingStock.per || ''}
              onChange={(e) => setEditingStock({ ...editingStock, per: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-400 mb-1">키워드 (쉼표로 구분)</label>
          <input
            type="text"
            value={editingStock.keywords?.join(', ') || ''}
            onChange={(e) => setEditingStock({ ...editingStock, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-400 mb-1">기업 설명</label>
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

      {/* 투자포인트 섹션 */}
      <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-red-400 tracking-wider">투자 포인트</h3>
          <button
            onClick={() => setShowAddPoint(true)}
            className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
          >
            + 추가
          </button>
        </div>
        <div className="space-y-3">
          {investmentPoints.map((point: any, idx) => (
            <div key={point.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className="flex-1">
                <div className="font-bold text-white text-sm">{point.title}</div>
                <div className="text-xs text-slate-400 mt-1">{point.description}</div>
              </div>
              <button onClick={() => handleDeletePoint(point.id)} className="text-red-400 hover:text-red-300 text-xs">삭제</button>
            </div>
          ))}
        </div>
        {showAddPoint && (
          <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
            <input
              type="text"
              placeholder="제목"
              value={newPoint.title}
              onChange={(e) => setNewPoint({ ...newPoint, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm mb-2"
            />
            <textarea
              placeholder="설명"
              value={newPoint.description}
              onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none mb-2"
            />
            <div className="flex gap-2">
              <button onClick={handleAddPoint} className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">저장</button>
              <button onClick={() => setShowAddPoint(false)} className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold">취소</button>
            </div>
          </div>
        )}
      </section>

      {/* 사업부문 섹션 */}
      <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-red-400 tracking-wider">사업 부문</h3>
          <button
            onClick={() => setShowAddSegment(true)}
            className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
          >
            + 추가
          </button>
        </div>
        <div className="space-y-2">
          {businessSegments.map((seg: any, idx) => (
            <div key={seg.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className={`w-4 h-4 rounded ${seg.color}`} />
              <div className="flex-1">
                <span className="font-bold text-white text-sm">{seg.nameKr}</span>
                <span className="text-slate-500 text-xs ml-2">({seg.name})</span>
              </div>
              <span className="text-slate-400 text-sm font-bold">{seg.value}%</span>
              <button onClick={() => handleDeleteSegment(seg.id)} className="text-red-400 hover:text-red-300 text-xs">삭제</button>
            </div>
          ))}
        </div>
        {showAddSegment && (
          <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="영문명"
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
              <input
                type="text"
                placeholder="한글명"
                value={newSegment.nameKr}
                onChange={(e) => setNewSegment({ ...newSegment, nameKr: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="비율 %"
                value={newSegment.value || ''}
                onChange={(e) => setNewSegment({ ...newSegment, value: Number(e.target.value) })}
                className="w-24 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
              <select
                value={newSegment.color}
                onChange={(e) => setNewSegment({ ...newSegment, color: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              >
                {colorOptions.map(c => <option key={c} value={c}>{c.replace('bg-', '').replace('-500', '')}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddSegment} className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">저장</button>
              <button onClick={() => setShowAddSegment(false)} className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold">취소</button>
            </div>
          </div>
        )}
      </section>

      {/* 뉴스/이슈 섹션 */}
      <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-red-400 tracking-wider">뉴스 / 이슈 ({issues.length})</h3>
          <button
            onClick={() => setShowAddIssue(true)}
            className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
          >
            + 뉴스 추가
          </button>
        </div>

        {showAddIssue && (
          <div className="mb-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
            <input
              type="text"
              placeholder="제목 (선택)"
              value={newIssue.title}
              onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm mb-2"
            />
            <textarea
              placeholder="내용 *"
              value={newIssue.content}
              onChange={(e) => setNewIssue({ ...newIssue, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm resize-none mb-2"
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="키워드 (쉼표 구분)"
                value={newIssue.keywords}
                onChange={(e) => setNewIssue({ ...newIssue, keywords: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
              <input
                type="text"
                placeholder="날짜 (YY/MM/DD) *"
                value={newIssue.date}
                onChange={(e) => setNewIssue({ ...newIssue, date: e.target.value })}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={newIssue.isCMS}
                onChange={(e) => setNewIssue({ ...newIssue, isCMS: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-slate-400">CMS증권 코멘트</span>
            </label>
            <div className="flex gap-2">
              <button onClick={handleAddIssue} className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold">저장</button>
              <button onClick={() => setShowAddIssue(false)} className="px-3 py-1 rounded bg-slate-700 text-slate-300 text-xs font-bold">취소</button>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {issues.map((issue: any, idx) => (
            <div key={issue.id || idx} className={`p-4 rounded-lg ${issue.isCMS ? 'bg-red-900/20 border border-red-800/50' : 'bg-slate-800/50'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{issue.date}</span>
                  {issue.isCMS && <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black">CMS</span>}
                </div>
                <button onClick={() => handleDeleteIssue(issue.id)} className="text-red-400 hover:text-red-300 text-xs">삭제</button>
              </div>
              {issue.title && <div className="font-bold text-white text-sm mb-1">{issue.title}</div>}
              <div className="text-xs text-slate-400 line-clamp-3">{issue.content}</div>
              {issue.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-[10px]">#{kw}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminStockDetail;
