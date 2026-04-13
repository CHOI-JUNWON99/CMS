import React from 'react';
import { ETF } from '@/shared/types';

interface ETFDetailProps {
  etf: ETF;
  onBack: () => void;
  isDarkMode: boolean;
}

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: digits });
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const InfoRow = ({
  label,
  value,
  isDarkMode,
}: {
  label: string;
  value: string;
  isDarkMode: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-sm font-black text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
  </div>
);

const ETFDetail: React.FC<ETFDetailProps> = ({ etf, onBack, isDarkMode }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto pb-20">
      <div className="sticky top-16 z-40 py-4 mb-6 pointer-events-none">
        <button
          onClick={onBack}
          className={`pointer-events-auto inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 font-black transition-all ${isDarkMode ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white/90 border-gray-200 text-gray-700 shadow-sm'}`}
        >
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>
      </div>

      <section className={`pb-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-xl text-sm font-mono font-black ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>
            {etf.code}
          </span>
          {etf.sector && (
            <span className={`px-3 py-1 rounded-xl text-sm font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              {etf.sector}
            </span>
          )}
        </div>

        <h1 className={`text-4xl lg:text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {etf.nameEn}
        </h1>
        <p className={`mt-4 text-2xl lg:text-3xl font-black leading-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
          {etf.summary || 'ETF 개요가 아직 등록되지 않았습니다.'}
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-6">
        <div className={`rounded-[24px] border px-5 py-8 text-center flex flex-col justify-between ${isDarkMode ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>종가</div>
          <div className={`-mt-[20px] text-2xl font-black tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(etf.closePriceCny, 4)}
            <span className={`ml-1 text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>원</span>
          </div>
          <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
          <div className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>거래량</div>
          <div className={`-mt-[20px] text-2xl font-black tracking-tight whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(etf.volume, 0)}
            <span className={`ml-1 text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>주</span>
          </div>
        </div>

        <div className={`rounded-[24px] border px-8 py-8 ${isDarkMode ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
            <div>
              <InfoRow label="상장일" value={etf.listingDate || '-'} isDarkMode={isDarkMode} />
              <InfoRow label="AUM(CNY 백만)" value={formatNumber(etf.aumCnyMillion, 1)} isDarkMode={isDarkMode} />
              <InfoRow label="AUM(KRW억원)" value={formatNumber(etf.aumKrwBillion, 1)} isDarkMode={isDarkMode} />
              <InfoRow label="최소매수단위" value={etf.minimumPurchaseUnit ? `${formatNumber(etf.minimumPurchaseUnit, 0)}주` : '-'} isDarkMode={isDarkMode} />
              <InfoRow label="최소매수금액" value={etf.minimumPurchaseAmountKrw ? `${formatNumber(etf.minimumPurchaseAmountKrw, 0)}원` : '-'} isDarkMode={isDarkMode} />
              <InfoRow label="벤치마크 명칭" value={etf.benchmarkNameEn || '-'} isDarkMode={isDarkMode} />
              <InfoRow label="대분류 / 소분류" value={`${etf.categoryLarge || '-'} / ${etf.categorySmall || '-'}`} isDarkMode={isDarkMode} />
            </div>
            <div>
              <InfoRow label="TER" value={etf.ter === null || etf.ter === undefined ? '-' : `${etf.ter}%`} isDarkMode={isDarkMode} />
              <InfoRow label="배당률" value={formatPercent(etf.dividendYield)} isDarkMode={isDarkMode} />
              <InfoRow label="일평균 거래대금(YTD)" value={formatNumber(etf.avgTradingValueYtdBillion, 1)} isDarkMode={isDarkMode} />
              <InfoRow label="1M" value={formatPercent(etf.return1M)} isDarkMode={isDarkMode} />
              <InfoRow label="3M" value={formatPercent(etf.return3M)} isDarkMode={isDarkMode} />
              <InfoRow label="6M" value={formatPercent(etf.return6M)} isDarkMode={isDarkMode} />
              <InfoRow label="1Y" value={formatPercent(etf.return1Y)} isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </section>

      <section className={`mt-8 rounded-[24px] border px-8 py-7 ${isDarkMode ? 'bg-[#112240] border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ETF 개요</h2>
        <p className={`mt-4 whitespace-pre-line text-[15px] leading-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {etf.summary || '등록된 ETF 개요가 없습니다.'}
        </p>
      </section>
    </div>
  );
};

export default ETFDetail;
