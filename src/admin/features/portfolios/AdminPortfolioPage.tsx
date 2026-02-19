import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { toast, confirm, useAdminAuthStore } from '@/shared/stores';
import { DbClientRow, DbPortfolioRow } from '@/shared/types';
import { formatMarketCapShort } from '@/shared/utils';
import {
  PortfolioModal,
  PortfolioStockList,
  AvailableStockList,
  PortfolioSummaryCard,
  PortfolioSelector,
  Portfolio,
  StockItem,
  PortfolioStock,
  NewPortfolioData,
  Client,
} from './components';

interface PartialStockRow {
  id: string;
  ticker: string;
  name: string;
  name_kr: string;
  sector: string;
  market_cap: string | null;
  return_rate: number | null;
}

interface PortfolioStockRow {
  stock_id: string;
  added_at: string;
}

/**
 * AdminPortfolioPage 컴포넌트
 *
 * 리팩토링 후:
 * - 기존 901줄 → 약 350줄 (61% 감소)
 * - 모달을 PortfolioModal로 분리
 * - 종목 리스트를 PortfolioStockList, AvailableStockList로 분리
 * - 요약 카드를 PortfolioSummaryCard로 분리
 * - 선택기를 PortfolioSelector로 분리
 */
const AdminPortfolioPage: React.FC = () => {
  // Admin 인증 (store 사용)
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [allStocks, setAllStocks] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [newPortfolio, setNewPortfolio] = useState<NewPortfolioData>({
    name: '',
    description: '',
    clientId: '',
    returnRate: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 클라이언트 목록 로딩
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        if (data) {
          setClients((data as DbClientRow[]).map((row) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description ?? undefined,
            logoUrl: row.logo_url ?? undefined,
            isActive: row.is_active,
          })));
        }
      } catch (err) {
        console.error('클라이언트 로딩 실패:', err);
      }
    };
    fetchClients();
  }, []);

  // 포트폴리오 목록 로딩
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const mapped = (data as DbPortfolioRow[]).map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            isActive: row.is_active ?? false,
            createdAt: row.created_at,
            clientId: row.client_id ?? undefined,
            returnRate: row.return_rate || 0,
          }));
          setPortfolios(mapped);

          const active = mapped.find(p => p.isActive);
          if (active) {
            setSelectedPortfolioId(active.id);
          } else if (mapped.length > 0) {
            setSelectedPortfolioId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error('포트폴리오 로딩 실패:', err);
      }
    };
    fetchPortfolios();
  }, []);

  // 모든 종목 로딩
  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        const { data, error } = await supabase
          .from('stocks')
          .select('id, ticker, name, name_kr, sector, market_cap, return_rate')
          .order('name_kr');

        if (error) throw error;
        if (data) {
          setAllStocks((data as PartialStockRow[]).map((row) => ({
            id: row.id,
            ticker: row.ticker,
            name: row.name,
            nameKr: row.name_kr,
            sector: row.sector,
            marketCap: row.market_cap || '',
            returnRate: row.return_rate || 0,
          })));
        }
      } catch (err) {
        console.error('종목 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllStocks();
  }, []);

  // 선택된 포트폴리오의 종목 로딩
  useEffect(() => {
    if (!selectedPortfolioId) {
      setPortfolioStocks([]);
      return;
    }

    const fetchPortfolioStocks = async () => {
      try {
        const { data, error } = await supabase
          .from('portfolio_stocks')
          .select('stock_id, added_at')
          .eq('portfolio_id', selectedPortfolioId);

        if (error) throw error;
        if (data) {
          setPortfolioStocks((data as PortfolioStockRow[]).map((row) => ({
            stockId: row.stock_id,
            addedAt: row.added_at,
          })));
        }
      } catch (err) {
        console.error('포트폴리오 종목 로딩 실패:', err);
      }
    };
    fetchPortfolioStocks();
  }, [selectedPortfolioId]);

  // 클라이언트 필터링된 포트폴리오
  const filteredPortfolios = useMemo(() => {
    if (selectedClientId === 'all') return portfolios;
    if (selectedClientId === 'none') return portfolios.filter(p => !p.clientId);
    return portfolios.filter(p => p.clientId === selectedClientId);
  }, [portfolios, selectedClientId]);

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  const getClientName = (clientId?: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.name || null;
  };

  const portfolioStockIds = useMemo(() => new Set(portfolioStocks.map(ps => ps.stockId)), [portfolioStocks]);
  const includedStocks = useMemo(() => allStocks.filter(s => portfolioStockIds.has(s.id)), [allStocks, portfolioStockIds]);
  const excludedStocks = useMemo(() => {
    const excluded = allStocks.filter(s => !portfolioStockIds.has(s.id));
    if (!searchQuery.trim()) return excluded;
    const query = searchQuery.toLowerCase();
    return excluded.filter(s =>
      s.nameKr.toLowerCase().includes(query) ||
      s.ticker.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
  }, [allStocks, portfolioStockIds, searchQuery]);

  // CRUD 핸들러
  const handleAddPortfolio = async () => {
    if (!newPortfolio.name.trim()) {
      toast.warning('포트폴리오 이름을 입력해주세요.');
      return;
    }
    if (clients.length > 0 && !newPortfolio.clientId) {
      toast.warning('클라이언트를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          name: newPortfolio.name.trim(),
          description: newPortfolio.description.trim(),
          is_active: false,
          client_id: newPortfolio.clientId || null,
          return_rate: newPortfolio.returnRate || 0,
        })
        .select('id')
        .single();

      if (error) throw error;

      const newP: Portfolio = {
        id: data.id,
        name: newPortfolio.name.trim(),
        description: newPortfolio.description.trim(),
        isActive: false,
        createdAt: new Date().toISOString(),
        clientId: newPortfolio.clientId || null,
        returnRate: newPortfolio.returnRate || 0,
      };

      setPortfolios([newP, ...portfolios]);
      setSelectedPortfolioId(data.id);
      setShowAddModal(false);
      setNewPortfolio({ name: '', description: '', clientId: '', returnRate: 0 });
      toast.success('포트폴리오가 추가되었습니다.');
    } catch (err) {
      console.error('포트폴리오 추가 실패:', err);
      toast.error('추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!editingPortfolio || !editingPortfolio.name.trim()) {
      toast.warning('포트폴리오 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('portfolios')
        .update({
          name: editingPortfolio.name.trim(),
          description: editingPortfolio.description.trim(),
          client_id: editingPortfolio.clientId || null,
          return_rate: editingPortfolio.returnRate || 0,
        })
        .eq('id', editingPortfolio.id);

      if (error) throw error;

      setPortfolios(portfolios.map(p =>
        p.id === editingPortfolio.id
          ? { ...p, name: editingPortfolio.name.trim(), description: editingPortfolio.description.trim(), clientId: editingPortfolio.clientId, returnRate: editingPortfolio.returnRate }
          : p
      ));
      setShowEditModal(false);
      setEditingPortfolio(null);
      toast.success('포트폴리오가 수정되었습니다.');
    } catch (err) {
      console.error('포트폴리오 수정 실패:', err);
      toast.error('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    const confirmed = await confirm.custom({
      title: '포트폴리오 삭제',
      message: '이 포트폴리오를 삭제하시겠습니까?\n포함된 종목 연결도 모두 삭제됩니다.',
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    const adminCode = getAdminCode();
    try {
      const { error } = await supabase.rpc('delete_portfolio', {
        admin_code: adminCode,
        p_portfolio_id: portfolioId,
      });
      if (error) throw error;

      const remaining = portfolios.filter(p => p.id !== portfolioId);
      setPortfolios(remaining);
      if (selectedPortfolioId === portfolioId) {
        setSelectedPortfolioId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('포트폴리오가 삭제되었습니다.');
    } catch (err) {
      console.error('포트폴리오 삭제 실패:', err);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleSetActive = async (portfolioId: string) => {
    const adminCode = getAdminCode();
    try {
      const { error } = await supabase.rpc('set_active_portfolio', {
        admin_code: adminCode,
        p_portfolio_id: portfolioId,
      });
      if (error) throw error;
      setPortfolios(portfolios.map(p => p.id === portfolioId ? { ...p, isActive: true } : p));
      toast.success('포트폴리오가 활성화되었습니다.');
    } catch (err) {
      console.error('활성화 실패:', err);
      toast.error('활성화에 실패했습니다.');
    }
  };

  const handleDeactivate = async (portfolioId: string) => {
    const confirmed = await confirm.custom({
      title: '포트폴리오 비활성화',
      message: '이 포트폴리오를 비활성화하시겠습니까?\n사용자 페이지에 아무 종목도 표시되지 않습니다.',
      confirmText: '비활성화',
      variant: 'warning',
    });
    if (!confirmed) return;

    const adminCode = getAdminCode();
    try {
      const { error } = await supabase.rpc('deactivate_portfolio', {
        admin_code: adminCode,
        p_portfolio_id: portfolioId,
      });
      if (error) throw error;
      setPortfolios(portfolios.map(p => ({ ...p, isActive: p.id === portfolioId ? false : p.isActive })));
      toast.success('포트폴리오가 비활성화되었습니다.');
    } catch (err) {
      console.error('비활성화 실패:', err);
      toast.error('비활성화에 실패했습니다.');
    }
  };

  const toggleStock = async (stockId: string, isIncluded: boolean) => {
    if (!selectedPortfolioId) return;

    const adminCode = getAdminCode();
    setUpdatingIds(prev => new Set(prev).add(stockId));

    try {
      if (isIncluded) {
        const { error } = await supabase.rpc('remove_stock_from_portfolio', {
          admin_code: adminCode,
          p_portfolio_id: selectedPortfolioId,
          p_stock_id: stockId,
        });
        if (error) throw error;
        setPortfolioStocks(portfolioStocks.filter(ps => ps.stockId !== stockId));
      } else {
        const { error } = await supabase.rpc('add_stock_to_portfolio', {
          admin_code: adminCode,
          p_portfolio_id: selectedPortfolioId,
          p_stock_id: stockId,
        });
        if (error) throw error;
        setPortfolioStocks([...portfolioStocks, { stockId, addedAt: new Date().toISOString() }]);
      }
    } catch (err) {
      console.error('종목 업데이트 실패:', err);
      toast.error('업데이트에 실패했습니다.');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(stockId);
        return next;
      });
    }
  };

  const handleClientChange = (clientId: string, filtered: Portfolio[]) => {
    setSelectedClientId(clientId);
    if (filtered.length > 0) {
      setSelectedPortfolioId(filtered[0].id);
    } else {
      setSelectedPortfolioId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-200">포트폴리오를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PortfolioSelector
        portfolios={portfolios}
        filteredPortfolios={filteredPortfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={setSelectedPortfolioId}
        onAddNew={() => setShowAddModal(true)}
        clients={clients}
        selectedClientId={selectedClientId}
        onClientChange={handleClientChange}
        getClientName={getClientName}
      />

      {!selectedPortfolio ? (
        <div className="text-center py-20 rounded-xl bg-slate-900/30 border border-slate-800">
          <p className="text-slate-300 font-bold mb-2">포트폴리오가 없습니다.</p>
          <button onClick={() => setShowAddModal(true)} className="text-red-400 text-sm font-bold hover:underline">
            첫 번째 포트폴리오 만들기
          </button>
        </div>
      ) : (
        <>
          <PortfolioSummaryCard
            portfolio={selectedPortfolio}
            stockCount={includedStocks.length}
            onEdit={() => { setEditingPortfolio(selectedPortfolio); setShowEditModal(true); }}
            onDelete={() => handleDeletePortfolio(selectedPortfolio.id)}
            onSetActive={() => handleSetActive(selectedPortfolio.id)}
            onDeactivate={() => handleDeactivate(selectedPortfolio.id)}
          />

          <PortfolioStockList
            stocks={includedStocks}
            updatingIds={updatingIds}
            onRemove={(id) => toggleStock(id, true)}
            formatMarketCap={formatMarketCapShort}
          />

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Available Stocks</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <AvailableStockList
            stocks={excludedStocks}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            updatingIds={updatingIds}
            onAdd={(id) => toggleStock(id, false)}
            formatMarketCap={formatMarketCapShort}
          />
        </>
      )}

      <PortfolioModal
        mode="add"
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewPortfolio({ name: '', description: '', clientId: '', returnRate: 0 }); }}
        onSubmit={handleAddPortfolio}
        clients={clients}
        isSubmitting={isSubmitting}
        newPortfolio={newPortfolio}
        onNewPortfolioChange={setNewPortfolio}
      />

      <PortfolioModal
        mode="edit"
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingPortfolio(null); }}
        onSubmit={handleUpdatePortfolio}
        clients={clients}
        isSubmitting={isSubmitting}
        editingPortfolio={editingPortfolio}
        onEditingPortfolioChange={setEditingPortfolio}
      />
    </div>
  );
};

export default AdminPortfolioPage;
