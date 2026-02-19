import { GoogleGenAI, Type } from "@google/genai";

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  if (issues.length === 0) {
    throw new Error("분석할 이슈 데이터가 없습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `당신은 20년 경력의 중국 시장 전문 애널리스트입니다.
PB(Private Banker) 고객을 대상으로 투자 인사이트를 제공합니다.
- 전문적이면서도 이해하기 쉬운 어투를 사용합니다.
- 투자 기회와 리스크를 균형있게 분석합니다.
- 핵심 성장 동력과 주요 이벤트를 강조합니다.

---

기업(${stockNameKr})의 최신 타임라인 정보를 분석하여 현재 방향성을 요약해주세요.
한국어로 3~4문장으로 답변하되, 투자자 관점에서 의미있는 포인트를 강조하세요.

타임라인 정보:
${issues.map(item => `[${item.date}] ${item.title}
${item.content}
`).join('\n---\n')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['summary', 'keywords']
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    summary: data.summary || '',
    keywords: data.keywords || []
  };
}
