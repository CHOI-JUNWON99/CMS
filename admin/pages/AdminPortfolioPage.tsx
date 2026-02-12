import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types';

interface Portfolio {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  clientId?: string | null;
  returnRate: number;
}

interface StockItem {
  id: string;
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  marketCap: string;
  returnRate: number;
}

interface PortfolioStock {
  stockId: string;
  addedAt: string;
}

const AdminPortfolioPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [allStocks, setAllStocks] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // 클라이언트 관련 상태
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [newPortfolio, setNewPortfolio] = useState({ name: '', description: '', clientId: '', returnRate: 0 });
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
          setClients(data.map((row: any) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description,
            logoUrl: row.logo_url,
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
          const mapped = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description || '',
            isActive: row.is_active ?? false,
            createdAt: row.created_at,
            clientId: row.client_id,
            returnRate: row.return_rate || 0,
          }));
          setPortfolios(mapped);

          // 활성화된 포트폴리오 또는 첫 번째 선택
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
          setAllStocks(data.map((row: any) => ({
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
          setPortfolioStocks(data.map((row: any) => ({
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

  // 선택된 포트폴리오
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  // 클라이언트 이름 가져오기
  const getClientName = (clientId?: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.name || null;
  };

  // 포트폴리오에 포함된 종목 ID Set
  const portfolioStockIds = useMemo(() => {
    return new Set(portfolioStocks.map(ps => ps.stockId));
  }, [portfolioStocks]);

  // 포트폴리오 종목 (상세 정보 포함)
  const includedStocks = useMemo(() => {
    return allStocks.filter(s => portfolioStockIds.has(s.id));
  }, [allStocks, portfolioStockIds]);

  // 미포함 종목 (검색 필터링)
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

  // 포트폴리오 추가
  const handleAddPortfolio = async () => {
    if (!newPortfolio.name.trim()) {
      alert('포트폴리오 이름을 입력해주세요.');
      return;
    }

    if (clients.length > 0 && !newPortfolio.clientId) {
      alert('클라이언트를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 직접 insert 사용 (client_id 포함)
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
    } catch (err) {
      console.error('포트폴리오 추가 실패:', err);
      alert('추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 포트폴리오 수정
  const handleUpdatePortfolio = async () => {
    if (!editingPortfolio || !editingPortfolio.name.trim()) {
      alert('포트폴리오 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 직접 update 사용 (client_id, return_rate 포함)
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
          ? {
              ...p,
              name: editingPortfolio.name.trim(),
              description: editingPortfolio.description.trim(),
              clientId: editingPortfolio.clientId,
              returnRate: editingPortfolio.returnRate,
            }
          : p
      ));
      setShowEditModal(false);
      setEditingPortfolio(null);
    } catch (err) {
      console.error('포트폴리오 수정 실패:', err);
      alert('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 포트폴리오 삭제
  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?\n포함된 종목 연결도 모두 삭제됩니다.')) return;

    const adminCode = localStorage.getItem('cms_admin_code') || '';

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
    } catch (err) {
      console.error('포트폴리오 삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  // 포트폴리오 활성화
  const handleSetActive = async (portfolioId: string) => {
    const adminCode = localStorage.getItem('cms_admin_code') || '';

    try {
      const { error } = await supabase.rpc('set_active_portfolio', {
        admin_code: adminCode,
        p_portfolio_id: portfolioId,
      });

      if (error) throw error;

      setPortfolios(portfolios.map(p =>
        p.id === portfolioId ? { ...p, isActive: true } : p
      ));
    } catch (err) {
      console.error('활성화 실패:', err);
      alert('활성화에 실패했습니다.');
    }
  };

  // 포트폴리오 비활성화
  const handleDeactivate = async (portfolioId: string) => {
    if (!confirm('이 포트폴리오를 비활성화하시겠습니까?\n사용자 페이지에 아무 종목도 표시되지 않습니다.')) return;

    const adminCode = localStorage.getItem('cms_admin_code') || '';

    try {
      const { error } = await supabase.rpc('deactivate_portfolio', {
        admin_code: adminCode,
        p_portfolio_id: portfolioId,
      });

      if (error) throw error;

      setPortfolios(portfolios.map(p => ({
        ...p,
        isActive: p.id === portfolioId ? false : p.isActive,
      })));
    } catch (err) {
      console.error('비활성화 실패:', err);
      alert('비활성화에 실패했습니다.');
    }
  };

  // 종목 추가/제거
  const toggleStock = async (stockId: string, isIncluded: boolean) => {
    if (!selectedPortfolioId) return;

    const adminCode = localStorage.getItem('cms_admin_code') || '';
    setUpdatingIds(prev => new Set(prev).add(stockId));

    try {
      if (isIncluded) {
        // 제거
        const { error } = await supabase.rpc('remove_stock_from_portfolio', {
          admin_code: adminCode,
          p_portfolio_id: selectedPortfolioId,
          p_stock_id: stockId,
        });
        if (error) throw error;
        setPortfolioStocks(portfolioStocks.filter(ps => ps.stockId !== stockId));
      } else {
        // 추가
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
      alert('업데이트에 실패했습니다.');
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(stockId);
        return next;
      });
    }
  };

  const formatMarketCapShort = (capStr: string) => {
    if (!capStr) return '-';
    const parts = capStr.split(' ');
    if (parts.length < 2) return capStr;
    const joPart = parts[0].replace('조', '');
    const okPart = parts[1].replace('억원', '').replace(',', '');
    const okFirstDigit = okPart.charAt(0) || '0';
    return `${joPart}.${okFirstDigit}조`;
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
      {/* 클라이언트 필터 */}
      {clients.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => {
              const newClientId = e.target.value;
              setSelectedClientId(newClientId);

              // 필터링된 포트폴리오 중 첫 번째 자동 선택
              let filtered;
              if (newClientId === 'all') {
                filtered = portfolios;
              } else if (newClientId === 'none') {
                filtered = portfolios.filter(p => !p.clientId);
              } else {
                filtered = portfolios.filter(p => p.clientId === newClientId);
              }

              if (filtered.length > 0) {
                setSelectedPortfolioId(filtered[0].id);
              } else {
                setSelectedPortfolioId(null);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-slate-600"
          >
            <option value="all">전체</option>
            <option value="none">미지정</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 포트폴리오 선택 영역 */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider mr-1">Portfolio:</span>
        {filteredPortfolios.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPortfolioId(p.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
              selectedPortfolioId === p.id
                ? 'bg-slate-700 text-white ring-1 ring-slate-400'
                : 'bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{p.name}</span>
            {getClientName(p.clientId) && (
              <span className="ml-1.5 text-[9px] text-slate-300 opacity-60">
                ({getClientName(p.clientId)})
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-dashed border-slate-700 text-slate-300 text-xs font-bold hover:border-slate-600 hover:text-slate-200 transition-all"
        >
          + 새 포트폴리오
        </button>
      </div>

      {/* 선택된 포트폴리오가 없을 때 */}
      {!selectedPortfolio ? (
        <div className="text-center py-20 rounded-xl bg-slate-900/30 border border-slate-800">
          <p className="text-slate-300 font-bold mb-2">포트폴리오가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-red-400 text-sm font-bold hover:underline"
          >
            첫 번째 포트폴리오 만들기
          </button>
        </div>
      ) : (
        <>
          {/* 포트폴리오 요약 카드 */}
          <div className="relative rounded-2xl border bg-[#112240] border-slate-700 shadow-xl p-6 mb-10 overflow-hidden">
            {/* 상단: 타이틀 + 액션 버튼 */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-black text-white mb-1">{selectedPortfolio.name}</h2>
                {selectedPortfolio.description && (
                  <p className="text-sm text-slate-200">{selectedPortfolio.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedPortfolio.isActive ? (
                  <button
                    onClick={() => handleDeactivate(selectedPortfolio.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-600 transition-all"
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }} />
                    활성화 중
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetActive(selectedPortfolio.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-600 transition-all"
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#000000', flexShrink: 0 }} />
                    비활성화 중
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingPortfolio(selectedPortfolio);
                    setShowEditModal(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  삭제
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="flex items-center gap-8 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">종목 수</span>
                <span className="text-lg font-black text-white">{includedStocks.length}</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">수익률</span>
                <span className={`text-lg font-black ${selectedPortfolio.returnRate >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {selectedPortfolio.returnRate >= 0 ? '+' : ''}{selectedPortfolio.returnRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* 포트폴리오에 포함된 종목 */}
          <div className="mb-10">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              포트폴리오 구성 종목
              <span className="text-slate-300 font-medium">({includedStocks.length})</span>
            </h3>

            {includedStocks.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-slate-300 font-bold">포트폴리오에 포함된 종목이 없습니다.</p>
                <p className="text-slate-600 text-sm mt-1">아래에서 종목을 추가해주세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {includedStocks.map(stock => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#112240] border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white truncate">{stock.nameKr}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                          {stock.ticker}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-300">{formatMarketCapShort(stock.marketCap)}</span>
                        <span className={`font-bold ${(stock.returnRate || 0) >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                          {(stock.returnRate || 0) >= 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStock(stock.id, true)}
                      disabled={updatingIds.has(stock.id)}
                      className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50 flex-shrink-0"
                      title="포트폴리오에서 제외"
                    >
                      {updatingIds.has(stock.id) ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Available Stocks</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* 추가 가능한 종목 */}
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              미포함 종목
              <span className="text-slate-300 font-medium">({excludedStocks.length})</span>
            </h3>

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

            {excludedStocks.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-slate-900/30 border border-slate-800">
                <p className="text-slate-300 font-bold">
                  {searchQuery ? '검색 결과가 없습니다.' : '모든 종목이 포트폴리오에 포함되어 있습니다.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {excludedStocks.map(stock => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-300 truncate">{stock.nameKr}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                          {stock.ticker}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-600">{formatMarketCapShort(stock.marketCap)}</span>
                        <span className={`font-bold ${(stock.returnRate || 0) >= 0 ? 'text-rose-400/60' : 'text-blue-400/60'}`}>
                          {(stock.returnRate || 0) >= 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStock(stock.id, false)}
                      disabled={updatingIds.has(stock.id)}
                      className="p-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all disabled:opacity-50 flex-shrink-0"
                      title="포트폴리오에 추가"
                    >
                      {updatingIds.has(stock.id) ? (
                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 포트폴리오 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-6">새 포트폴리오</h3>

            <div className="space-y-4">
              {clients.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">클라이언트 *</label>
                  <select
                    value={newPortfolio.clientId}
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  >
                    <option value="">클라이언트 선택</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={newPortfolio.name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  placeholder="CMS X 쿼터백 차이나 미래성장랩"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">설명</label>
                <textarea
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-slate-600"
                  placeholder="포트폴리오 설명 (선택)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">수익률 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPortfolio.returnRate || ''}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, returnRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  placeholder="예: 12.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPortfolio({ name: '', description: '', clientId: '', returnRate: 0 });
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddPortfolio}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포트폴리오 수정 모달 */}
      {showEditModal && editingPortfolio && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-md p-6">
            <h3 className="text-lg font-black text-white mb-6">포트폴리오 수정</h3>

            <div className="space-y-4">
              {clients.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">소속</label>
                  <select
                    value={editingPortfolio.clientId || ''}
                    onChange={(e) => setEditingPortfolio({ ...editingPortfolio, clientId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  >
                    <option value="">미지정</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">소속을 변경하면 해당 소속의 사용자만 이 포트폴리오를 볼 수 있습니다.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">이름 *</label>
                <input
                  type="text"
                  value={editingPortfolio.name}
                  onChange={(e) => setEditingPortfolio({ ...editingPortfolio, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">설명</label>
                <textarea
                  value={editingPortfolio.description}
                  onChange={(e) => setEditingPortfolio({ ...editingPortfolio, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">수익률 (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPortfolio.returnRate || ''}
                  onChange={(e) => setEditingPortfolio({ ...editingPortfolio, returnRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600"
                  placeholder="예: 12.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPortfolio(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleUpdatePortfolio}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortfolioPage;
