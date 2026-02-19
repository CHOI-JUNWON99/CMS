import React from 'react';

interface ExcelUploadGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: () => void;
}

const ExcelUploadGuide: React.FC<ExcelUploadGuideProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full p-6" style={{ maxWidth: '900px' }}>
        <h3 className="text-lg font-black text-white mb-4">엑셀 일괄 업로드</h3>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800/50">
            <p className="text-emerald-400 text-sm font-bold mb-2">기능 안내</p>
            <ul className="text-emerald-200/80 text-xs space-y-1 list-disc list-inside">
              <li>기존 종목 (DB에 있는 ticker): 데이터 업데이트</li>
              <li>신규 종목 (DB에 없는 ticker): 자동 추가</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50">
            <p className="text-amber-400 text-sm font-bold mb-2">주의사항</p>
            <ul className="text-amber-200/80 text-xs space-y-1 list-disc list-inside">
              <li><strong className="text-amber-300">1행은 날짜헤더, 2행부터 데이터 인식</strong> (1행은 인식 X)</li>
              <li>ticker 컬럼은 필수입니다</li>
              <li>빈 셀은 기존 값을 유지합니다 (기존 종목)</li>
              <li>신규 종목의 name_kr이 없으면 ticker로 대체됩니다</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-slate-300 text-sm font-bold mb-3">엑셀 양식</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-emerald-400 font-mono">ticker</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">name_kr</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">name</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">sector</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">marketCap</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">totalReturn</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">PER</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">PBR</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">PSR</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">description</th>
                    <th className="text-left py-2 px-2 text-slate-200 font-mono">keywords</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 px-2">002050.SZ</td>
                    <td className="py-2 px-2">삼화전기</td>
                    <td className="py-2 px-2">Samhwa</td>
                    <td className="py-2 px-2">전자부품</td>
                    <td className="py-2 px-2">5조</td>
                    <td className="py-2 px-2">25.3</td>
                    <td className="py-2 px-2">12.5</td>
                    <td className="py-2 px-2">1.8</td>
                    <td className="py-2 px-2">2.3</td>
                    <td className="py-2 px-2">전기 부품 제조...</td>
                    <td className="py-2 px-2">전기차, 배터리</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">005930.KS</td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2">350조</td>
                    <td className="py-2 px-2">-5.2</td>
                    <td className="py-2 px-2">12.1</td>
                    <td className="py-2 px-2">1.5</td>
                    <td className="py-2 px-2">2.1</td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-slate-500 text-[10px] mt-2">* keywords는 쉼표(,)로 구분하여 입력</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all"
          >
            취소
          </button>
          <button
            onClick={onSelectFile}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all"
          >
            엑셀 파일 선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadGuide;
