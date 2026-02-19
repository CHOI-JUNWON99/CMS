import React from 'react';
import { UploadResult } from './types';

interface ExcelUploadResultProps {
  result: UploadResult | null;
  onClose: () => void;
}

const ExcelUploadResult: React.FC<ExcelUploadResultProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 p-6" style={{ maxWidth: '400px', width: '100%' }}>
        {result.error ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-red-400">업로드 실패</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">{result.error}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-emerald-400">업로드 완료</h3>
            </div>
            <div className="space-y-3 mb-4">
              {result.updated > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span className="text-slate-300 text-sm">업데이트</span>
                  <span className="text-white text-lg font-black">{result.updated}개</span>
                </div>
              )}
              {result.inserted > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-900/30 border border-emerald-800/50">
                  <span className="text-emerald-300 text-sm">신규 추가</span>
                  <span className="text-emerald-400 text-lg font-black">{result.inserted}개</span>
                </div>
              )}
              {result.updated === 0 && result.inserted === 0 && (
                <p className="text-slate-400 text-sm">처리된 종목이 없습니다.</p>
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

export default ExcelUploadResult;
