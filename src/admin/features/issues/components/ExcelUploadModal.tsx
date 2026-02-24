import React, { useRef } from 'react';

export interface ExcelUploadResult {
  inserted: number;
  skipped: string[];
  duplicates?: string[];
  duplicate_count?: number;
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
            <p className="text-white text-sm font-bold mb-3">엑셀 양식 (가로 형태)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-600">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="py-2 px-2 text-emerald-400 font-mono border-r border-slate-600">ticker</th>
                    <th className="py-2 px-2 text-emerald-400 font-mono border-r border-slate-600">date</th>
                    <th className="py-2 px-2 text-emerald-400 font-mono border-r border-slate-600">title</th>
                    <th className="py-2 px-2 text-emerald-400 font-mono border-r border-slate-600">content</th>
                    <th className="py-2 px-2 text-slate-400 font-mono border-r border-slate-600">source</th>
                    <th className="py-2 px-2 text-slate-400 font-mono border-r border-slate-600">keywords</th>
                    <th className="py-2 px-2 text-slate-400 font-mono">is_cms</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-t border-slate-600">
                    <td className="py-2 px-2 border-r border-slate-600">9988.HK</td>
                    <td className="py-2 px-2 border-r border-slate-600">25/01/15</td>
                    <td className="py-2 px-2 border-r border-slate-600">Qwen App MAU...</td>
                    <td className="py-2 px-2 border-r border-slate-600">산하 Qwen App...</td>
                    <td className="py-2 px-2 border-r border-slate-600">로이터</td>
                    <td className="py-2 px-2 border-r border-slate-600">AI, 클라우드</td>
                    <td className="py-2 px-2">TRUE</td>
                  </tr>
                  <tr className="border-t border-slate-600/50">
                    <td className="py-2 px-2 border-r border-slate-600">AAPL</td>
                    <td className="py-2 px-2 border-r border-slate-600">25/01/16</td>
                    <td className="py-2 px-2 border-r border-slate-600">신제품 발표...</td>
                    <td className="py-2 px-2 border-r border-slate-600">애플이 새로운...</td>
                    <td className="py-2 px-2 border-r border-slate-600">블룸버그</td>
                    <td className="py-2 px-2 border-r border-slate-600">아이폰</td>
                    <td className="py-2 px-2">FALSE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <span className="text-red-400">● 필수:</span> ticker, date, title, content &nbsp;
              <span className="text-slate-500">● 선택:</span> source, keywords, is_cms
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-700/50">
            <p className="text-blue-300 text-sm font-bold mb-2">컬럼 설명</p>
            <ul className="text-slate-300 text-sm space-y-1.5">
              <li>
                <span className="text-blue-400 font-mono">is_cms</span>: CMS에서 작성한 주요 코멘트인지 여부입니다.
                <span className="text-slate-400 ml-1">
                  TRUE로 설정하면 해당 뉴스가 종목 상세 페이지에서 "CMS 코멘트" 뱃지와 함께 강조 표시됩니다.
                  일반 뉴스는 FALSE 또는 비워두세요.
                </span>
              </li>
              <li>
                <span className="text-blue-400 font-mono">keywords</span>: 뉴스와 관련된 키워드입니다.
                <span className="text-slate-400 ml-1">
                  쉼표(,)로 구분하여 여러 개 입력 가능 (예: AI, 클라우드, 반도체)
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/50">
            <p className="text-amber-300 text-sm font-bold mb-2">주의사항</p>
            <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
              <li>첫 번째 행은 반드시 헤더여야 합니다</li>
              <li>ticker는 DB에 등록된 종목 티커와 정확히 일치해야 합니다</li>
              <li>date는 YY/MM/DD 형식 또는 엑셀 날짜 형식 모두 지원합니다</li>
              <li>
                <span className="text-emerald-400">중복 체크:</span> 티커 + 날짜 + 제목이 동일하면 자동 스킵됩니다
              </li>
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
              {result.duplicates && result.duplicates.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-700/50">
                  <p className="text-slate-300 text-sm mb-1">
                    중복 스킵 ({result.duplicate_count || result.duplicates.length}건)
                  </p>
                  <div className="text-slate-400 text-xs max-h-20 overflow-y-auto">
                    {result.duplicates.slice(0, 5).map((dup, i) => (
                      <p key={i}>{dup}</p>
                    ))}
                    {result.duplicates.length > 5 && (
                      <p className="text-slate-500">외 {result.duplicates.length - 5}건...</p>
                    )}
                  </div>
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
