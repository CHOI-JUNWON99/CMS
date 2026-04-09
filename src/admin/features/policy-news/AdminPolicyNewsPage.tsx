import React, { useState, useEffect, useCallback } from 'react';
import AdminPolicyNewsFeed from './AdminPolicyNewsFeed';
import { supabase } from '@/shared/lib/supabase';
import { PolicyNews, DbPolicyNewsRow } from '@/shared/types';

const AdminPolicyNewsPage: React.FC = () => {
  const [policyNews, setPolicyNews] = useState<PolicyNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: newsData } = await supabase
          .from('policy_news')
          .select('*')
          .order('date', { ascending: false });

        if (newsData) {
          const mapped = (newsData as DbPolicyNewsRow[]).map((row) => ({
            id: row.id,
            title: row.title ?? undefined,
            content: row.content,
            keywords: row.keywords || [],
            date: row.date,
            isCMS: row.is_cms ?? false,
            images: (row.images || []).map((img) => (typeof img === 'string' ? { url: img, source: '', date: '' } : img)),
            clientId: row.client_id ?? undefined,
            createdAt: row.created_at ?? undefined,
            updatedAt: row.updated_at ?? undefined,
          }));
          setPolicyNews(mapped);
        }
      } catch (err) {
        console.error('정책 뉴스 데이터 로딩 실패:', err);
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
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">정책 뉴스를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminPolicyNewsFeed
      policyNews={policyNews}
      onRefresh={refreshData}
    />
  );
};

export default AdminPolicyNewsPage;
