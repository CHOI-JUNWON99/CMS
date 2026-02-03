import React, { useState, useEffect, useCallback } from 'react';
import AdminIssuesFeed from '../AdminIssuesFeed';
import { supabase } from '../../lib/supabase';
import { Stock } from '../../types';

const AdminIssuesPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [glossary, setGlossary] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 뉴스 관리에 필요한 데이터만 가져옴
        const [stocksRes, issuesRes, glossaryRes] = await Promise.all([
          supabase.from('stocks').select('id, ticker, name, name_kr'),
          supabase.from('issues').select('*').order('date', { ascending: false }),
          supabase.from('glossary').select('*'),
        ]);

        // 용어사전
        if (glossaryRes.data) {
          const g: Record<string, string> = {};
          glossaryRes.data.forEach((row: { term: string; definition: string }) => {
            g[row.term] = row.definition;
          });
          setGlossary(g);
        }

        // 이슈를 stock_id로 그룹
        const issuesByStock: Record<string, any[]> = {};
        if (issuesRes.data) {
          issuesRes.data.forEach((issue: any) => {
            const imageUrls = issue.images || [];
            const mapped = {
              id: issue.id,
              title: issue.title,
              content: issue.content,
              keywords: issue.keywords || [],
              date: issue.date,
              isCMS: issue.is_cms,
              images: imageUrls.map((url: string) => ({ url })),
            };
            if (!issuesByStock[issue.stock_id]) issuesByStock[issue.stock_id] = [];
            issuesByStock[issue.stock_id].push(mapped);
          });
        }

        // 간소화된 Stock 객체 조립 (뉴스 관리에 필요한 필드만)
        if (stocksRes.data) {
          const assembled: Stock[] = stocksRes.data.map((row: any) => ({
            id: row.id,
            ticker: row.ticker,
            name: row.name,
            nameKr: row.name_kr,
            sector: '',
            keywords: [],
            investmentPoints: [],
            marketCap: '',
            marketCapValue: 0,
            price: 0,
            change: 0,
            returnRate: 0,
            description: '',
            issues: issuesByStock[row.id] || [],
            businessSegments: [],
          }));
          setStocks(assembled);
        }
      } catch (err) {
        console.error('뉴스 데이터 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-400">뉴스를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminIssuesFeed
      stocks={stocks}
      glossary={glossary}
      onRefresh={refreshData}
    />
  );
};

export default AdminIssuesPage;
