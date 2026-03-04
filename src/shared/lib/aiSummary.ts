interface AiSummaryResult {
  summary: string;
  keywords: string[];
}

interface IssueData {
  date: string;
  title: string;
  content: string;
}

export async function generateAiSummary(
  stockNameKr: string,
  issues: IssueData[]
): Promise<AiSummaryResult> {
  if (issues.length === 0) {
    throw new Error("분석할 이슈 데이터가 없습니다.");
  }

  // 서버 프록시를 통해 Gemini API 호출 (API 키 노출 방지)
  const response = await fetch('/api/proxy/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ stockNameKr, issues }),
  });

  if (!response.ok) {
    throw new Error(`AI 요약 생성 실패: ${response.status}`);
  }

  const data = await response.json();
  return {
    summary: data.summary || '',
    keywords: data.keywords || [],
  };
}
