import React, { useRef } from 'react';

interface IBExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

const IBExcelUploadModal: React.FC<IBExcelUploadModalProps> = ({ isOpen, onClose, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-2xl p-6 my-8">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white">IB 투자의견 엑셀 업로드</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
            <p className="text-emerald-300 text-sm font-bold mb-2">기능 안내</p>
            <p className="text-slate-300 text-sm">
              글로벌 IB 투자의견 엑셀 파일을 업로드합니다. Row 0은 타이틀, Row 1&2는 빈 줄, Row 3은 헤더, Row 4부터 데이터를 파싱합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-white text-sm font-bold mb-3">엑셀 컬럼 (14개)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-600">
                <thead>
                  <tr className="bg-slate-700/50">
                    {['날짜', '종목명', 'Ticker', 'Sector', 'IB', '투자의견', '기존주가', '목표주가', '목표가변화', '현재주가', '업사이드', 'EPS', '코멘트', '애널리스트'].map((col) => (
                      <th key={col} className="py-1.5 px-1.5 text-emerald-400 font-mono border-r border-slate-600 whitespace-nowrap text-[10px]">{col}</th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <span className="text-red-400">● 필수:</span> 날짜, 종목명, Ticker, IB &nbsp;
              <span className="text-slate-500">● 선택:</span> 나머지 컬럼
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/50">
            <p className="text-amber-300 text-sm font-bold mb-2">주의사항</p>
            <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
              <li>Row 0: 타이틀, Row 1&2: 빈 줄, Row 3: 헤더, Row 4+: 데이터</li>
              <li>날짜는 엑셀 날짜 형식(시리얼 넘버) 자동 변환됩니다</li>
              <li>중복 체크: Ticker + 날짜 + IB + 애널리스트 조합이 동일하면 스킵</li>
              <li>"-" 값은 null로 처리됩니다</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-all">
            취소
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all">
            엑셀 파일 선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default IBExcelUploadModal;
