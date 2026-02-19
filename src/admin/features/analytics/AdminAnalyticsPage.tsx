import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/stores';

interface ChartDataItem {
  label: string;
  count: number;
}

interface PortfolioStat {
  id: string;
  name: string;
  count: number;
}

interface RecentView {
  id: string;
  portfolio_id: string;
  portfolio_name: string;
  viewed_at: string;
}

interface AnalyticsData {
  total_views: number;
  chart_data: ChartDataItem[];
  portfolio_stats: PortfolioStat[];
  recent_views: RecentView[];
}

type Period = 'daily' | 'weekly' | 'monthly';

const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');

  // 포트폴리오 목록 가져오기 (드롭다운용)
  useEffect(() => {
    const fetchPortfolios = async () => {
      const { data } = await supabase.from('portfolios').select('id, name');
      if (data) setPortfolios(data);
    };
    fetchPortfolios();
  }, []);

  // 분석 데이터 가져오기 (RPC 사용)
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('get_portfolio_analytics', {
        p_period: period,
        p_portfolio_id: selectedPortfolio === 'all' ? null : selectedPortfolio,
      });

      if (error) throw error;
      setData(result);
    } catch (err: unknown) {
      console.error('분석 데이터 로딩 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error('분석 데이터 로딩 실패: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [period, selectedPortfolio]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxCount = data ? Math.max(...data.chart_data.map(d => d.count), 1) : 1;

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

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-sm font-bold text-slate-400">데이터를 불러올 수 없습니다</span>
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
          <div className="text-3xl font-black text-white">{data.total_views.toLocaleString()}</div>
          <div className="text-xs text-slate-400">
            {selectedPortfolio === 'all' ? '전체' : portfolios.find(p => p.id === selectedPortfolio)?.name} 조회수
          </div>
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
          {data.chart_data.map((d, i) => (
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

        {data.portfolio_stats.length === 0 ? (
          <div className="text-center py-8 text-slate-400">조회 데이터가 없습니다</div>
        ) : (
          <div className="space-y-3">
            {data.portfolio_stats.map((stat, i) => {
              const totalForPercentage = data.portfolio_stats.reduce((sum, s) => sum + s.count, 0);
              const percentage = totalForPercentage > 0 ? (stat.count / totalForPercentage) * 100 : 0;
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

      {/* 최근 조회 기록 (20개) */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-sm font-bold text-slate-300 mb-4">최근 조회 기록 (최근 20건)</h2>

        {data.recent_views.length === 0 ? (
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
                {data.recent_views.map(view => {
                  const viewDate = new Date(view.viewed_at);
                  return (
                    <tr key={view.id} className="text-sm border-b border-slate-700/50">
                      <td className="py-3 text-white font-medium">{view.portfolio_name || '-'}</td>
                      <td className="py-3 text-slate-400">
                        {viewDate.toLocaleDateString('ko-KR')} {viewDate.toLocaleTimeString('ko-KR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
