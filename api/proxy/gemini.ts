import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, parseCookies } from '../_lib/tokens.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 인증 확인
  const cookies = parseCookies(req.headers.cookie || null);
  const accessToken = cookies['cms_access_token'];

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 관리자만 AI 요약 생성 가능
  if (payload.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const { stockNameKr, issues } = req.body || {};
  if (!stockNameKr || !issues || !Array.isArray(issues)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const prompt = `당신은 20년 경력의 중국 시장 전문 애널리스트입니다.
PB(Private Banker) 고객을 대상으로 투자 인사이트를 제공합니다.
- 전문적이면서도 이해하기 쉬운 어투를 사용합니다.
- 투자 기회와 리스크를 균형있게 분석합니다.
- 핵심 성장 동력과 주요 이벤트를 강조합니다.

---

기업(${stockNameKr})의 최신 타임라인 정보를 분석하여 현재 방향성을 요약해주세요.
한국어로 3~4문장으로 답변하되, 투자자 관점에서 의미있는 포인트를 강조하세요.

타임라인 정보:
${issues.map((item: { date: string; title: string; content: string }) => `[${item.date}] ${item.title}\n${item.content}\n`).join('\n---\n')}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                summary: { type: 'STRING' },
                keywords: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['summary', 'keywords'],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiData = await response.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text);

    return res.status(200).json({
      summary: parsed.summary || '',
      keywords: parsed.keywords || [],
    });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'AI generation failed' });
  }
}
