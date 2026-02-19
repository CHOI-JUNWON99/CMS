import React, { useState } from 'react';
import { getAdminSupabase } from '@/shared/lib/supabase';
import { generateAiSummary } from '@/shared/lib/aiSummary';
import { toast } from '@/shared/stores';

interface Issue {
  date: string;
  title?: string;
  content: string;
}

interface Props {
  stockId: string;
  stockNameKr: string;
  aiSummary?: string;
  aiSummaryKeywords?: string[];
  issues: Issue[];
  onRefresh: () => void;
}

const AiSummarySection: React.FC<Props> = ({
  stockId,
  stockNameKr,
  aiSummary: initialSummary,
  aiSummaryKeywords: initialKeywords,
  issues,
  onRefresh,
}) => {
  const [summary, setSummary] = useState(initialSummary || '');
  const [keywordsRaw, setKeywordsRaw] = useState(initialKeywords?.join(', ') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (issues.length === 0) {
      toast.warning('요약을 생성할 이슈 데이터가 없습니다.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAiSummary(
        stockNameKr,
        issues.map(issue => ({
          date: issue.date,
          title: issue.title || '',
          content: issue.content,
        }))
      );

      setSummary(result.summary);
      setKeywordsRaw(result.keywords.join(', '));

      toast.success('AI 요약이 생성되었습니다. 확인 후 저장해주세요.');
    } catch (error) {
      console.error('AI 요약 생성 실패:', error);
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        toast.error('API 요청 한도 초과! 내일 다시 시도하거나 새 API 키를 발급받으세요.');
      } else {
        toast.error('AI 요약 생성에 실패했습니다: ' + errorMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await getAdminSupabase()
        .from('stocks')
        .update({
          ai_summary: summary || null,
          ai_summary_keywords: keywordsRaw
            .split(',')
            .map(k => k.trim())
            .filter(k => k),
        })
        .eq('id', stockId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('저장 실패: 권한이 없습니다. 관리자 코드를 확인해주세요.');
        return;
      }
      onRefresh();
      toast.success('AI 요약이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('저장 실패: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const keywordList = keywordsRaw
    .split(',')
    .map(k => k.trim())
    .filter(k => k);

  return (
    <section className="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-black text-red-400 tracking-wider">AI 기업활동 요약</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || issues.length === 0}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              생성 중...
            </>
          ) : (
            <>AI 요약 재생성</>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1">
            키워드 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={keywordsRaw}
            onChange={(e) => setKeywordsRaw(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            placeholder="AI 기술 상용화, 클라우드, B2C 생태계"
          />
        </div>

        {keywordList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywordList.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1">요약 내용</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
            placeholder="AI 기업활동 요약 내용을 입력하세요..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : 'AI 요약 저장'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AiSummarySection;
