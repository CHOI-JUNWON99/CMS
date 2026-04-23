import React from "react";
import { ETF } from "@/shared/types";

export type EtfSortKey =
  | "nameEn"
  | "sector"
  | "aumKrwBillion"
  | "avgTradingValueYtdBillion"
  | "return1M"
  | "return3M"
  | "return6M"
  | "return1Y";
export type EtfSortDirection = "ASC" | "DESC";

interface ETFListProps {
  etfs: ETF[];
  onSelect: (etf: ETF) => void;
  isDarkMode: boolean;
  sortKey: EtfSortKey;
  sortDirection: EtfSortDirection;
  onSort: (key: EtfSortKey) => void;
}

const DESKTOP_GRID_TEMPLATE =
  "100px minmax(220px,1.3fr) minmax(120px,0.8fr) minmax(110px,0.7fr) minmax(150px,1fr) minmax(76px,0.55fr) minmax(76px,0.55fr) minmax(76px,0.55fr) minmax(76px,0.6fr)";

const HEADER_CELL_CLASS = [
  "pl-5 text-left",
  "text-left",
  "text-left",
  "translate-x-[25px] text-center",
  "translate-x-[25px] text-center",
  "translate-x-[25px] text-center",
  "translate-x-[25px] text-center",
  "translate-x-[25px] text-center",
  "translate-x-[25px] text-center",
] as const;

const HEADER_LABELS = [
  "TICKER",
  "NAME",
  "SECTOR",
  "AUM(억원)",
  "일평균 거래대금\n(YTD, 억원)",
  "1M",
  "3M",
  "6M",
  "1Y",
] as const;

const numberOrDash = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "-"
    : value.toLocaleString("ko-KR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
      });

const percentOrDash = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "-"
    : `${value > 0 ? "+" : ""}${value.toFixed(2)}`;

const labelClass = (isDarkMode: boolean) =>
  `${isDarkMode ? "text-slate-400" : "text-gray-500"} text-[11px] font-bold tracking-wide`;

const valueClass = (isDarkMode: boolean) =>
  `${isDarkMode ? "text-white" : "text-gray-900"} text-[17px] font-black leading-tight`;

const percentClass = (
  value: number | null | undefined,
  isDarkMode: boolean,
) => {
  if (value === null || value === undefined) {
    return isDarkMode ? "text-white" : "text-gray-900";
  }
  return value >= 0
    ? isDarkMode
      ? "text-rose-400"
      : "text-rose-600"
    : isDarkMode
      ? "text-blue-400"
      : "text-blue-600";
};

const ETFList: React.FC<ETFListProps> = ({
  etfs,
  onSelect,
  isDarkMode,
  sortKey,
  sortDirection: _sortDirection,
  onSort,
}) => {
  const SortIndicator = ({ active: _active }: { active: boolean }) => (
    <div className="ml-1.5 flex shrink-0 flex-col items-center justify-center opacity-100">
      <svg
        className={`mb-[-1px] h-2 w-2 transition-colors ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
      </svg>
      <svg
        className={`mt-[-1px] h-2 w-2 transition-colors ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5.293 7.293a1 1 0 01-1.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </div>
  );

  const HeaderButton = ({
    label,
    targetKey,
    className,
  }: {
    label: string;
    targetKey: EtfSortKey;
    className: string;
  }) => {
    const active = sortKey === targetKey;
    return (
      <button
        onClick={() => onSort(targetKey)}
        className={`${className} flex items-center py-1 outline-none transition-opacity hover:opacity-70`}
      >
        <span
          className={`whitespace-pre-line text-[11px] font-bold tracking-widest transition-colors ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
        >
          {label}
        </span>
        <SortIndicator active={active} />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div
        className={`hidden xl:grid items-center gap-3 px-5 py-2 text-[11px] font-bold tracking-widest ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
        style={{ gridTemplateColumns: DESKTOP_GRID_TEMPLATE }}
      >
        <span className={`${HEADER_CELL_CLASS[0]} whitespace-pre-line`}>
          {HEADER_LABELS[0]}
        </span>
        <div className={HEADER_CELL_CLASS[1]}>
          <HeaderButton
            label={HEADER_LABELS[1]}
            targetKey="nameEn"
            className="justify-start"
          />
        </div>
        <div className={HEADER_CELL_CLASS[2]}>
          <HeaderButton
            label={HEADER_LABELS[2]}
            targetKey="sector"
            className="justify-start"
          />
        </div>
        <div className={HEADER_CELL_CLASS[3]}>
          <HeaderButton
            label={HEADER_LABELS[3]}
            targetKey="aumKrwBillion"
            className="justify-center"
          />
        </div>
        <div className={HEADER_CELL_CLASS[4]}>
          <HeaderButton
            label={HEADER_LABELS[4]}
            targetKey="avgTradingValueYtdBillion"
            className="justify-center"
          />
        </div>
        <div className={HEADER_CELL_CLASS[5]}>
          <HeaderButton
            label={HEADER_LABELS[5]}
            targetKey="return1M"
            className="justify-center"
          />
        </div>
        <div className={HEADER_CELL_CLASS[6]}>
          <HeaderButton
            label={HEADER_LABELS[6]}
            targetKey="return3M"
            className="justify-center"
          />
        </div>
        <div className={HEADER_CELL_CLASS[7]}>
          <HeaderButton
            label={HEADER_LABELS[7]}
            targetKey="return6M"
            className="justify-center"
          />
        </div>
        <div className={HEADER_CELL_CLASS[8]}>
          <HeaderButton
            label={HEADER_LABELS[8]}
            targetKey="return1Y"
            className="justify-center"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {etfs.map((etf) => (
          <button
            key={etf.id}
            type="button"
            onClick={() => onSelect(etf)}
            className={`group w-full text-left rounded-[18px] border px-5 py-5 transition-all hover:-translate-y-0.5 ${
              isDarkMode
                ? "bg-[#112240] border-slate-700 hover:border-slate-500 shadow-lg"
                : "bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg"
            }`}
          >
            <div className="xl:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-mono font-black ${isDarkMode ? "bg-slate-800 text-primary-accent" : "bg-gray-100 text-primary"}`}
                  >
                    {etf.code}
                  </span>
                  <h3
                    className={`mt-3 text-[28px] sm:text-[30px] font-black tracking-tight leading-[1.05] break-words ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {etf.nameEn}
                  </h3>
                  <p
                    className={`mt-2 text-[13px] font-bold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                  >
                    {etf.benchmarkNameEn || etf.categoryLarge || "-"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={`${isDarkMode ? "text-slate-400" : "text-gray-500"} text-[10px] font-black tracking-widest`}
                  >
                    1Y
                  </div>
                  <div
                    className={`mt-1 text-[24px] font-black tracking-tight sm:text-[28px] ${percentClass(etf.return1Y, isDarkMode)}`}
                  >
                    {percentOrDash(etf.return1Y)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {etf.sector && (
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDarkMode ? "border-slate-600 text-slate-300 bg-slate-800" : "border-gray-200 text-gray-600 bg-gray-50"}`}
                  >
                    {etf.sector}
                  </span>
                )}
                {etf.categorySmall && (
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isDarkMode ? "border-slate-600 text-slate-300 bg-slate-800" : "border-gray-200 text-gray-600 bg-gray-50"}`}
                  >
                    {etf.categorySmall}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:[grid-template-columns:minmax(0,1.08fr)_minmax(0,0.88fr)_minmax(0,0.88fr)_minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div
                  className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center ${isDarkMode ? "bg-slate-900/40 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}
                >
                  <div className={`${labelClass(isDarkMode)} text-center`}>
                    AUM
                  </div>
                  <div
                    className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center text-[22px] sm:text-[18px]`}
                  >
                    {numberOrDash(etf.aumKrwBillion, 1)}
                  </div>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? "bg-slate-900/40 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}
                >
                  <div className={`${labelClass(isDarkMode)} text-center`}>
                    1M
                  </div>
                  <div
                    className={`${valueClass(isDarkMode)} ${percentClass(etf.return1M, isDarkMode)} mt-2 flex items-center justify-center text-center`}
                  >
                    {percentOrDash(etf.return1M)}%
                  </div>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? "bg-slate-900/40 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}
                >
                  <div className={`${labelClass(isDarkMode)} text-center`}>
                    3M
                  </div>
                  <div
                    className={`${valueClass(isDarkMode)} ${percentClass(etf.return3M, isDarkMode)} mt-2 flex items-center justify-center text-center`}
                  >
                    {percentOrDash(etf.return3M)}%
                  </div>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center md:px-2 ${isDarkMode ? "bg-slate-900/40 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}
                >
                  <div className={`${labelClass(isDarkMode)} text-center`}>
                    6M
                  </div>
                  <div
                    className={`${valueClass(isDarkMode)} ${percentClass(etf.return6M, isDarkMode)} mt-2 flex items-center justify-center text-center`}
                  >
                    {percentOrDash(etf.return6M)}%
                  </div>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center ${isDarkMode ? "bg-slate-900/40 border border-slate-700" : "bg-gray-50 border border-gray-100"}`}
                >
                  <div
                    className={`${labelClass(isDarkMode)} whitespace-nowrap text-center text-[10px] sm:text-[11px]`}
                  >
                    일평균 거래대금 (YTD, 억원)
                  </div>
                  <div
                    className={`${valueClass(isDarkMode)} mt-2 flex items-center justify-center text-center text-[20px] sm:text-[18px]`}
                  >
                    {numberOrDash(etf.avgTradingValueYtdBillion, 1)}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="hidden xl:grid items-center gap-3"
              style={{ gridTemplateColumns: DESKTOP_GRID_TEMPLATE }}
            >
              <div className="flex justify-start">
                <span
                  className={`inline-flex w-fit px-2 py-1 rounded-lg text-[11px] font-mono font-black ${isDarkMode ? "bg-slate-800 text-primary-accent" : "bg-gray-100 text-primary"}`}
                >
                  {etf.code}
                </span>
              </div>
              <div className="min-w-0">
                <div
                  className={`truncate font-black text-[15px] leading-tight ${isDarkMode ? "text-white" : "text-gray-900 group-hover:text-primary"}`}
                >
                  {etf.nameEn}
                </div>
                <div
                  className={`mt-1 truncate text-[11px] font-bold ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
                >
                  {etf.benchmarkNameEn || etf.categoryLarge || "-"}
                </div>
              </div>
              <div className="min-w-0 -translate-x-[5px] text-left">
                <span
                  className={`inline-flex max-w-full truncate px-2 py-0.5 rounded border text-[11px] font-bold ${isDarkMode ? "border-slate-600 text-slate-300 bg-slate-800" : "border-gray-200 text-gray-600 bg-gray-50"}`}
                >
                  {etf.sector || "-"}
                </span>
              </div>
              <span
                className={`flex min-w-0 items-center justify-center text-[14px] font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {numberOrDash(etf.aumKrwBillion, 1)}
              </span>
              <span
                className={`flex min-w-0 items-center justify-center text-[14px] font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {numberOrDash(etf.avgTradingValueYtdBillion, 1)}
              </span>
              <span
                className={`flex min-w-0 items-center justify-center text-[14px] font-bold ${percentClass(etf.return1M, isDarkMode)}`}
              >
                {percentOrDash(etf.return1M)}%
              </span>
              <span
                className={`flex min-w-0 items-center justify-center text-[14px] font-bold ${percentClass(etf.return3M, isDarkMode)}`}
              >
                {percentOrDash(etf.return3M)}%
              </span>
              <span
                className={`flex min-w-0 items-center justify-center text-[14px] font-bold ${percentClass(etf.return6M, isDarkMode)}`}
              >
                {percentOrDash(etf.return6M)}%
              </span>
              <span
                className={`flex min-w-0 items-center justify-center pr-5 text-[14px] font-black ${percentClass(etf.return1Y, isDarkMode)}`}
              >
                {percentOrDash(etf.return1Y)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ETFList;
