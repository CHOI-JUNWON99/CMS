import React from 'react';
import { ETF } from '@/shared/types';

interface ETFListProps {
  etfs: ETF[];
  onSelect: (etf: ETF) => void;
  isDarkMode: boolean;
}

const DESKTOP_GRID_TEMPLATE =
  '100px minmax(150px,1.27  fr) minmax(110px,0fr) minmax(110px,0.16fr) minmax(150px,0fr) minmax(76px,0fr) minmax(76px,0.42fr) minmax(76px,0.42fr) minmax(76px,0.48fr)';

const HEADER_CELL_CLASS = [
  'pl-4 text-left',
  'pr-10 text-center',
  'text-left',
  'pl-3 text-left',
  'text-center',
  'pl-5 text-left',
  'pl-6 text-left',
  'pl-8 text-left',
  'pl-3 text-center',
] as const;

const HEADER_LABELS = [
  'TICKER',
  'NAME',
  'SECTOR',
  'AUM(억원)',
  '일평균 거래대금\n(YTD, 억원)',
  '1M',
  '3M',
  '6M',
  '1Y',
] as const;

const numberOrDash = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? '-' : value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: digits });

const percentOrDash = (value: number | null | undefined) =>
  value === null || value === undefined ? '-' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

const labelClass = (isDarkMode: boolean) =>
  `${isDarkMode ? 'text-slate-400' : 'text-gray-500'} text-[11px] font-bold tracking-wide`;

const valueClass = (isDarkMode: boolean) =>
  `${isDarkMode ? 'text-white' : 'text-gray-900'} text-[17px] font-black leading-tight`;

const ETFList: React.FC<ETFListProps> = ({ etfs, onSelect, isDarkMode }) => {
  return (
    <div className="space-y-4">
      <div
        className={`hidden xl:grid items-center px-5 py-2 text-[11px] font-bold tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}
        style={{ gridTemplateColumns: DESKTOP_GRID_TEMPLATE }}
      >
        {HEADER_LABELS.map((label, index) => (
          <span key={label} className={`${HEADER_CELL_CLASS[index]} whitespace-pre-line`}>
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {etfs.map((etf) => (
          <button
            key={etf.id}
            type="button"
            onClick={() => onSelect(etf)}
            className={`group w-full text-left rounded-[18px] border px-5 py-5 transition-all hover:-translate-y-0.5 ${
              isDarkMode
                ? 'bg-[#112240] border-slate-700 hover:border-slate-500 shadow-lg'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg'
            }`}
          >
            <div className="xl:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-mono font-black ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>
                    {etf.code}
                  </span>
                  <h3 className={`mt-3 text-[28px] sm:text-[30px] font-black tracking-tight leading-[1.05] break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {etf.nameEn}
                  </h3>
                  <p className={`mt-2 text-[13px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {etf.benchmarkNameEn || etf.categoryLarge || '-'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'} text-[10px] font-black tracking-widest`}>1Y</div>
                  <div className={`mt-1 text-[24px] sm:text-[28px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {percentOrDash(etf.return1Y)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {etf.sector && (
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDarkMode ? 'border-slate-600 text-slate-300 bg-slate-800' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                    {etf.sector}
                  </span>
                )}
                {etf.categorySmall && (
                  <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDarkMode ? 'border-slate-600 text-slate-300 bg-slate-800' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                    {etf.categorySmall}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:[grid-template-columns:minmax(0,1.08fr)_minmax(0,0.88fr)_minmax(0,0.88fr)_minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center ${isDarkMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`${labelClass(isDarkMode)} text-center`}>AUM</div>
                  <div className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center text-[22px] sm:text-[18px]`}>{numberOrDash(etf.aumKrwBillion, 1)}</div>
                </div>
                <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`${labelClass(isDarkMode)} text-center`}>1M</div>
                  <div className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center`}>{percentOrDash(etf.return1M)}%</div>
                </div>
                <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`${labelClass(isDarkMode)} text-center`}>3M</div>
                  <div className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center`}>{percentOrDash(etf.return3M)}%</div>
                </div>
                <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`${labelClass(isDarkMode)} text-center`}>6M</div>
                  <div className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center`}>{percentOrDash(etf.return6M)}%</div>
                </div>
                <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center ${isDarkMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className={`${labelClass(isDarkMode)} whitespace-nowrap text-center text-[10px] sm:text-[11px]`}>일평균 거래대금 (YTD, 억원)</div>
                  <div className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center text-[20px] sm:text-[18px]`}>{numberOrDash(etf.avgTradingValueYtdBillion, 1)}</div>
                </div>
              </div>
            </div>

            <div
              className="hidden xl:grid items-center gap-3"
              style={{ gridTemplateColumns: DESKTOP_GRID_TEMPLATE }}
            >
              <span className={`inline-flex w-fit px-2 py-1 rounded-lg text-[11px] font-mono font-black ${isDarkMode ? 'bg-slate-800 text-primary-accent' : 'bg-gray-100 text-primary'}`}>
                {etf.code}
              </span>
              <div className="min-w-0">
                <div className={`truncate font-black text-[15px] leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900 group-hover:text-primary'}`}>{etf.nameEn}</div>
                <div className={`mt-1 truncate text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {etf.benchmarkNameEn || etf.categoryLarge || '-'}
                </div>
              </div>
              <div className="min-w-0 pl-2 text-left">
                <span className={`inline-flex max-w-full truncate px-2 py-0.5 rounded border text-[11px] font-bold ${isDarkMode ? 'border-slate-600 text-slate-300 bg-slate-800' : 'border-gray-200 text-gray-600 bg-gray-50'}`}>
                  {etf.sector || '-'}
                </span>
              </div>
              <span className={`flex min-w-0 items-center justify-center truncate pl-2 text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{numberOrDash(etf.aumKrwBillion, 1)}</span>
              <span className={`flex min-w-0 items-center justify-center truncate pl-10 text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{numberOrDash(etf.avgTradingValueYtdBillion, 1)}</span>
              <span className={`flex min-w-0 items-center justify-center pl-5 text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{percentOrDash(etf.return1M)}%</span>
              <span className={`flex min-w-0 items-center justify-center pl-5 text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{percentOrDash(etf.return3M)}%</span>
              <span className={`flex min-w-0 items-center justify-center pl-5 text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{percentOrDash(etf.return6M)}%</span>
              <span className={`flex min-w-0 items-center justify-center pl-5 text-[14px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{percentOrDash(etf.return1Y)}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ETFList;
