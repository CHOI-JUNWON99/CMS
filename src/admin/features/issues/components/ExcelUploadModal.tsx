import React, { useRef } from 'react';

export interface ExcelUploadResult {
  inserted: number;
  skipped: string[];
  errors: { ticker: string; row: number; reason: string }[];
}

interface ExcelUploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export const ExcelUploadGuideModal: React.FC<ExcelUploadGuideModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
}) => {
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-white">뉴스 엑셀 일괄 등록</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
            <p className="text-emerald-300 text-sm font-bold mb-2">기능 안내</p>
            <p className="text-slate-300 text-sm">
              엑셀 파일로 뉴스를 일괄 등록합니다. (신규 등록만, 기존 데이터 업데이트 없음)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-white text-sm font-bold mb-3">엑셀 양식</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-300 font-bold">컬럼명</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-bold">필수</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-bold">설명</th>
                    <th className="text-left py-2 px-2 text-slate-300 font-bold">예시</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-emerald-400">ticker</td>
                    <td className="py-2 px-2 text-red-400">필수</td>
                    <td className="py-2 px-2">종목 티커</td>
                    <td className="py-2 px-2 font-mono">9988.HK</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-emerald-400">title</td>
                    <td className="py-2 px-2 text-red-400">필수</td>
                    <td className="py-2 px-2">뉴스 제목</td>
                    <td className="py-2 px-2">Qwen App MAU 돌파</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-emerald-400">content</td>
                    <td className="py-2 px-2 text-red-400">필수</td>
                    <td className="py-2 px-2">뉴스 내용</td>
                    <td className="py-2 px-2">산하 Qwen App이...</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-emerald-400">date</td>
                    <td className="py-2 px-2 text-red-400">필수</td>
                    <td className="py-2 px-2">날짜 (YY/MM/DD)</td>
                    <td className="py-2 px-2 font-mono">25/01/15</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-2 font-mono text-emerald-400">is_cms</td>
                    <td className="py-2 px-2 text-slate-500">선택</td>
                    <td className="py-2 px-2">CMS 코멘트 여부</td>
                    <td className="py-2 px-2 font-mono">TRUE / FALSE</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2 font-mono text-emerald-400">keywords</td>
                    <td className="py-2 px-2 text-slate-500">선택</td>
                    <td className="py-2 px-2">쉼표 구분 키워드</td>
                    <td className="py-2 px-2">AI, 클라우드</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/50">
            <p className="text-amber-300 text-sm font-bold mb-2">주의사항</p>
            <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
              <li>첫 번째 행은 반드시 헤더여야 합니다</li>
              <li>ticker는 DB에 등록된 종목 티커와 정확히 일치해야 합니다</li>
              <li>date는 반드시 YY/MM/DD 형식으로 입력하세요 (예: 25/01/15)</li>
              <li>이미지는 엑셀로 업로드할 수 없습니다 (개별 편집 사용)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition-all"
          >
            취소
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
          >
            엑셀 파일 선택
          </button>
        </div>
      </div>
    </div>
  );
};

interface ExcelUploadResultModalProps {
  result: ExcelUploadResult | null;
  onClose: () => void;
}

export const ExcelUploadResultModal: React.FC<ExcelUploadResultModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  const hasOnlyErrors = result.errors.length > 0 && result.inserted === 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#112240] rounded-2xl border border-slate-700 p-6"
        style={{ maxWidth: '500px', width: '100%' }}
      >
        {hasOnlyErrors ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-red-400">업로드 실패</h3>
            </div>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-slate-300">
                  {err.row > 0 ? `행 ${err.row}: ` : ''}
                  {err.reason}
                </p>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-emerald-400">업로드 완료</h3>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-900/30">
                <span className="text-emerald-300 text-sm">등록 완료</span>
                <span className="text-emerald-400 text-lg font-black">{result.inserted}건</span>
              </div>
              {result.skipped.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-900/30">
                  <p className="text-amber-300 text-sm mb-1">스킵된 티커 (존재하지 않는 종목)</p>
                  <p className="text-amber-200 text-xs">{result.skipped.join(', ')}</p>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-900/30 max-h-32 overflow-y-auto">
                  <p className="text-red-300 text-sm mb-1">오류 발생</p>
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-200 text-xs">
                      행 {err.row}: {err.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-600 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
};
