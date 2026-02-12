import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

interface PortfolioView {
  id: string;
  portfolio_id: string;
  viewed_at: string;
  client_id: string | null;
}

interface Portfolio {
  id: string;
  name: string;
}

type Period = 'daily' | 'weekly' | 'monthly';

const AdminAnalyticsPage: React.FC = () => {
  const [views, setViews] = useState<PortfolioView[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [viewsRes, portfoliosRes] = await Promise.all([
          supabase.from('portfolio_views').select('*').order('viewed_at', { ascending: false }),
          supabase.from('portfolios').select('id, name'),
        ]);

        if (viewsRes.data) setViews(viewsRes.data);
        if (portfoliosRes.data) setPortfolios(portfoliosRes.data);
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredViews = useMemo(() => {
    if (selectedPortfolio === 'all') return views;
    return views.filter(v => v.portfolio_id === selectedPortfolio);
  }, [views, selectedPortfolio]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { label: string; count: number }[] = [];

    if (period === 'daily') {
      // 최근 14일
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = filteredViews.filter(v => v.viewed_at.split('T')[0] === dateStr).length;
        data.push({
          label: `${date.getMonth() + 1}/${date.getDate()}`,
          count,
        });
      }
    } else if (period === 'weekly') {
      // 최근 8주
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const count = filteredViews.filter(v => {
          const viewDate = new Date(v.viewed_at);
          return viewDate >= weekStart && viewDate <= weekEnd;
        }).length;

        data.push({
          label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}~`,
          count,
        });
      }
    } else {
      // 최근 6개월
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        const count = filteredViews.filter(v => {
          const viewDate = new Date(v.viewed_at);
          return viewDate.getFullYear() === year && viewDate.getMonth() === month;
        }).length;

        data.push({
          label: `${year}.${String(month + 1).padStart(2, '0')}`,
          count,
        });
      }
    }

    return data;
  }, [filteredViews, period]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const totalViews = filteredViews.length;

  const portfolioStats = useMemo(() => {
    const stats: { id: string; name: string; count: number }[] = portfolios.map(p => ({
      id: p.id,
      name: p.name,
      count: views.filter(v => v.portfolio_id === p.id).length,
    }));
    return stats.sort((a, b) => b.count - a.count);
  }, [views, portfolios]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">분석 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">조회수 분석</h1>
          <p className="text-sm text-slate-400 mt-1">포트폴리오별 조회수를 확인하세요</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{totalViews.toLocaleString()}</div>
          <div className="text-xs text-slate-400">전체 조회수</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">기간:</span>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  period === p
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p === 'daily' ? '일별' : p === 'weekly' ? '주별' : '월별'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">포트폴리오:</span>
          <select
            value={selectedPortfolio}
            onChange={e => setSelectedPortfolio(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="all">전체</option>
            {portfolios.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-6">
          {period === 'daily' ? '최근 14일' : period === 'weekly' ? '최근 8주' : '최근 6개월'} 조회수
        </h2>

        {/* 바 차트 */}
        <div className="flex items-end gap-2 h-48">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-bold text-slate-400">{d.count}</div>
              <div
                className="w-full bg-red-500/80 rounded-t transition-all hover:bg-red-500"
                style={{
                  height: `${(d.count / maxCount) * 100}%`,
                  minHeight: d.count > 0 ? '4px' : '0',
                }}
              />
              <div className="text-[10px] text-slate-500 text-center truncate w-full">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 포트폴리오별 순위 */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-4">포트폴리오별 조회수</h2>

        {portfolioStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400">조회 데이터가 없습니다</div>
        ) : (
          <div className="space-y-3">
            {portfolioStats.map((stat, i) => {
              const percentage = totalViews > 0 ? (stat.count / views.length) * 100 : 0;
              return (
                <div key={stat.id} className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-yellow-500 text-yellow-900' :
                    i === 1 ? 'bg-slate-400 text-slate-900' :
                    i === 2 ? 'bg-amber-600 text-amber-100' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{stat.name}</span>
                      <span className="text-sm font-bold text-slate-300">{stat.count.toLocaleString()}회</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 최근 조회 기록 */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-4">최근 조회 기록</h2>

        {filteredViews.length === 0 ? (
          <div className="text-center py-8 text-slate-400">조회 기록이 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                  <th className="pb-3 font-bold">포트폴리오</th>
                  <th className="pb-3 font-bold">조회 시간</th>
                </tr>
              </thead>
              <tbody>
                {filteredViews.slice(0, 20).map(view => {
                  const portfolio = portfolios.find(p => p.id === view.portfolio_id);
                  const viewDate = new Date(view.viewed_at);
                  return (
                    <tr key={view.id} className="text-sm border-b border-slate-700/50">
                      <td className="py-3 text-white font-medium">{portfolio?.name || '-'}</td>
                      <td className="py-3 text-slate-400">
                        {viewDate.toLocaleDateString('ko-KR')} {viewDate.toLocaleTimeString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredViews.length > 20 && (
              <div className="text-center mt-4 text-xs text-slate-400">
                최근 20개 기록만 표시됩니다
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
