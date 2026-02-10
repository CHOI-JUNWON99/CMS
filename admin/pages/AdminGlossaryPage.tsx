import React, { useState, useEffect, useCallback } from 'react';
import AdminGlossary from '../AdminGlossary';
import { supabase } from '../../lib/supabase';

const AdminGlossaryPage: React.FC = () => {
  const [glossary, setGlossary] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchGlossary = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.from('glossary').select('*');
        if (data) {
          const g: Record<string, string> = {};
          data.forEach((row: { term: string; definition: string }) => {
            g[row.term] = row.definition;
          });
          setGlossary(g);
        }
      } catch (err) {
        console.error('용어사전 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlossary();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">용어사전을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return <AdminGlossary glossary={glossary} onRefresh={refreshData} />;
};

export default AdminGlossaryPage;
