import React from 'react';
import { Portfolio, Client } from './types';

interface PortfolioSelectorProps {
  portfolios: Portfolio[];
  filteredPortfolios: Portfolio[];
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string) => void;
  onAddNew: () => void;
  // Client filter
  clients: Client[];
  selectedClientId: string;
  onClientChange: (clientId: string, filteredPortfolios: Portfolio[]) => void;
  getClientName: (clientId?: string | null) => string | null;
}

const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  portfolios,
  filteredPortfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onAddNew,
  clients,
  selectedClientId,
  onClientChange,
  getClientName,
}) => {
  const handleClientFilterChange = (newClientId: string) => {
    let filtered: Portfolio[];
    if (newClientId === 'all') {
      filtered = portfolios;
    } else if (newClientId === 'none') {
      filtered = portfolios.filter(p => !p.clientId);
    } else {
      filtered = portfolios.filter(p => p.clientId === newClientId);
    }
    onClientChange(newClientId, filtered);
  };

  return (
    <>
      {/* 클라이언트 필터 */}
      {clients.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => handleClientFilterChange(e.target.value)}
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
            onClick={() => onSelectPortfolio(p.id)}
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
          onClick={onAddNew}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-dashed border-slate-700 text-slate-300 text-xs font-bold hover:border-slate-600 hover:text-slate-200 transition-all"
        >
          + 새 포트폴리오
        </button>
      </div>
    </>
  );
};

export default PortfolioSelector;
