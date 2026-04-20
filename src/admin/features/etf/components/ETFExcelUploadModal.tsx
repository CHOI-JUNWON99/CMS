import React, { useRef } from 'react';

interface ETFExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

const ETFExcelUploadModal: React.FC<ETFExcelUploadModalProps> = ({ isOpen, onClose, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = [
    '코드', '명칭(영문)', '종가(위안)', '최소매수단위(주)', '최소매수금액(원)', '상장일',
    'AUM(CNY 백만 위안)', 'AUM(KRW억원)', '벤치마크 명칭(영문)', '대분류', '소분류', 'TER*',
    '배당률', '일평균 거래대금(YTD,억원)', 'NAV', '1M(%)', '3M(%)', '6M(%)', '1Y(%)', '섹터', '거래량', 'ETF개요',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-[#112240] p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFileSelect(file);
              onClose();
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-black text-white">ETF 엑셀 업로드</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-4">
            <p className="mb-2 text-sm font-bold text-emerald-300">업로드 규칙</p>
            <p className="text-sm text-slate-300">
              첫 번째 시트의 1행을 헤더로 읽고, 2행부터 ETF 데이터를 업서트합니다. 속성명의 순서는 중요하지 않으며, 속성명은 아래 엑셀 예시와 정확히 일치해야 합니다. 같은 코드가 이미 있으면 업데이트하고, 없으면 신규 생성합니다.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-3 text-sm font-bold text-white">엑셀 컬럼 (22개)</p>
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-600 text-xs">
                <thead>
                  <tr className="bg-slate-700/50">
                    {columns.map((col) => (
                      <th key={col} className="whitespace-nowrap border-r border-slate-600 px-2 py-1.5 text-[10px] font-mono text-emerald-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800">
            취소
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            엑셀 파일 선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default ETFExcelUploadModal;
