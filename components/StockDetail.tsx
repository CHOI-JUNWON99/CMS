import React, { useState, useEffect, useMemo } from 'react';
import { Stock, IssueImage } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface StockDetailProps {
  stock: Stock;
  onBack: () => void;
  isDarkMode: boolean;
}

interface UnifiedInsight {
  date: string;
  type: 'ISSUE' | 'COMMENT';
  isCMS: boolean;
  title: string;
  content: string;
  keywords: string[];
  images?: IssueImage[];
}

interface IssueAnalysis {
  interpretation: string;
  glossary: { term: string; definition: string }[];
}

interface AiBriefing {
  summary: string;
  keywords: string[];
}

const TextWithCMS: React.FC<{ text: string; isDarkMode: boolean; isTitle?: boolean; hideBadge?: boolean }> = ({ text, isDarkMode: _isDarkMode, isTitle, hideBadge }) => {
  if (!text.includes('[CMS증권]')) return <>{text}</>;

  const parts = text.split('[CMS증권]');
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && !hideBadge && (
            <span className={`inline-flex items-center justify-center bg-primary text-white font-black px-1.5 py-0.5 rounded text-[10px] shadow-sm tracking-tighter ${isTitle ? 'scale-110' : 'scale-100'}`} style={{ verticalAlign: 'middle', marginTop: '-2px' }}>
              CMS
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

const getSegmentIcon = (name: string, isDark: boolean) => {
  const n = (name || '').toLowerCase();
  const cls = `w-6 h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;
  // 커머스 / 쇼핑 / 리테일
  if (n.includes('커머스') || n.includes('commerce') || n.includes('쇼핑') || n.includes('리테일') || n.includes('retail') || n.includes('tmall') || n.includes('타오바오'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
  // 클라우드 / AI / 인텔리전스
  if (n.includes('클라우드') || n.includes('cloud') || n.includes('ai') || n.includes('인텔리전스') || n.includes('intelligence') || n.includes('서버') || n.includes('데이터센터'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>;
  // 디지털 커머스 / 해외 / 글로벌
  if (n.includes('국제') || n.includes('글로벌') || n.includes('global') || n.includes('해외') || n.includes('international'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
  // 로컬 서비스 / O2O / 지도
  if (n.includes('로컬') || n.includes('local') || n.includes('o2o') || n.includes('지도') || n.includes('map') || n.includes('서비스'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
  // 물류 / 배송
  if (n.includes('물류') || n.includes('logistics') || n.includes('배송') || n.includes('delivery') || n.includes('차이나오') || n.includes('cainiao'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
  // 미디어 / 엔터 / 콘텐츠 / 영상
  if (n.includes('미디어') || n.includes('media') || n.includes('엔터') || n.includes('entertainment') || n.includes('콘텐츠') || n.includes('content') || n.includes('영상') || n.includes('동영상') || n.includes('스트리밍'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>;
  // 게임
  if (n.includes('게임') || n.includes('game'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.657-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" /></svg>;
  // 광고 / 마케팅
  if (n.includes('광고') || n.includes('advertising') || n.includes('마케팅') || n.includes('marketing') || n.includes('ad'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>;
  // 금융 / 핀테크 / 결제
  if (n.includes('금융') || n.includes('핀테크') || n.includes('fintech') || n.includes('finance') || n.includes('결제') || n.includes('payment') || n.includes('보험') || n.includes('증권') || n.includes('뱅크') || n.includes('은행'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>;
  // 반도체 / 칩
  if (n.includes('반도체') || n.includes('semiconductor') || n.includes('chip') || n.includes('메모리') || n.includes('파운드리'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>;
  // 자동차 / 모빌리티
  if (n.includes('자동차') || n.includes('vehicle') || n.includes('모빌리티') || n.includes('ev') || n.includes('auto'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>;
  // 디스플레이 / 패널
  if (n.includes('디스플레이') || n.includes('display') || n.includes('oled') || n.includes('패널'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>;
  // 배터리 / 에너지
  if (n.includes('배터리') || n.includes('battery') || n.includes('에너지') || n.includes('energy') || n.includes('전력') || n.includes('태양'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
  // 바이오 / 제약 / 헬스
  if (n.includes('바이오') || n.includes('제약') || n.includes('pharma') || n.includes('헬스') || n.includes('health') || n.includes('의료'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
  // 통신 / 네트워크
  if (n.includes('통신') || n.includes('telecom') || n.includes('네트워크') || n.includes('5g'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>;
  // 건설 / 부동산
  if (n.includes('건설') || n.includes('construction') || n.includes('엔지니어링') || n.includes('부동산'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>;
  // 철강 / 소재 / 화학
  if (n.includes('철강') || n.includes('소재') || n.includes('화학') || n.includes('material'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" /></svg>;
  // 식품 / 음료 / F&B
  if (n.includes('식품') || n.includes('음료') || n.includes('food') || n.includes('beverage') || n.includes('f&b'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" /></svg>;
  // 플랫폼 / 온라인
  if (n.includes('플랫폼') || n.includes('platform') || n.includes('온라인') || n.includes('online'))
    return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
  // 기본 아이콘 (비즈니스)
  return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>;
};

const StockDetail: React.FC<StockDetailProps> = ({ stock, onBack, isDarkMode }) => {
  const [aiBriefing, setAiBriefing] = useState<AiBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<UnifiedInsight | null>(null);
  const [isAnalyzingIssue, setIsAnalyzingIssue] = useState(false);
  const [issueAnalysis, setIssueAnalysis] = useState<IssueAnalysis | null>(null);

  const timelineData = useMemo(() => {
    return stock.issues.map(issue => ({
      date: issue.date,
      type: issue.title?.includes('[CMS증권]') ? 'COMMENT' as const : 'ISSUE' as const,
      isCMS: !!issue.isCMS,
      title: issue.title || '',
      content: issue.content,
      keywords: issue.keywords || [],
      images: issue.images
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [stock]);

  useEffect(() => {
    const fetchAiSummary = async () => {
      // DB에 저장된 AI 요약이 있으면 그것을 사용
      if (stock.aiSummary && stock.aiSummary.trim()) {
        setAiBriefing({
          summary: stock.aiSummary,
          keywords: stock.aiSummaryKeywords || [],
        });
        return;
      }

      if (timelineData.length === 0) {
        setAiBriefing(null);
        return;
      }
      setIsLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `기업(${stock.nameKr})의 최신 타임라인 정보들을 종합 분석하여, 이 회사가 현재 어떤 방향으로 나아가고 있는지 요약해줘. 한국어로 3~4문장 정도로 답변해. 타임라인 정보: ${timelineData.map(item => `[${item.date}] ${item.title}`).join(', ')}`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
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
        setAiBriefing(data);
      } catch (error) {
        console.error("AI Summary Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAiSummary();
  }, [stock, timelineData]);

  const handleInsightClick = async (insight: UnifiedInsight) => {
    setSelectedInsight(insight);
    setIsAnalyzingIssue(true);
    setIssueAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `이슈: ${insight.title}\n내용: ${insight.content}\n\n위 내용에 대한 해석과 용어 풀이를 한국어로 제공해줘.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretation: { type: Type.STRING },
              glossary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      setIssueAnalysis(data);
    } catch (error) {
      console.error('Analysis Error:', error);
    } finally {
      setIsAnalyzingIssue(false);
    }
  };

  const formatMarketCapDetail = (capStr: string) => {
    const parts = capStr.split(' ');
    if (parts.length < 2) return <span>{capStr}</span>;
    const joPart = parts[0].replace('조', '');
    const okPart = parts[1].replace('억원', '');
    return (
      <span className={`inline-flex items-baseline ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
        <span className="text-xl lg:text-3xl font-black tracking-tight">{joPart}</span>
        <span className="text-lg lg:text-xl font-black mx-0.5">조</span>
        <span className="text-xl lg:text-3xl font-black tracking-tight ml-1.5">{okPart}</span>
        <span className="text-lg lg:text-xl font-black ml-0.5">억</span>
      </span>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-20 relative px-4 lg:px-0">
      {/* Sticky Back Button */}
      <div className="sticky top-16 z-40 py-4 mb-6 pointer-events-none">
        <button onClick={onBack} className={`pointer-events-auto inline-flex items-center transition-all group py-2.5 px-6 rounded-2xl backdrop-blur-xl border shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-600' : 'bg-white/80 hover:bg-gray-50 border-gray-300'}`}>
          <svg className={`w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform text-primary`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          <span className={`text-[15px] font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>목록으로</span>
        </button>
      </div>

      {/* Top Section: Corporate Title & Basic Stats */}
      <div className={`mb-10 pb-10 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`text-[13px] font-mono font-black tracking-wider px-3 py-1.5 rounded-lg border inline-block uppercase ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-300'}`}>{stock.ticker}</div>
            </div>
            <div>
              <h1 className={`text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.nameKr}</h1>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{stock.name}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-sm font-black px-4 py-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/10`}>{stock.sector}</span>
              {stock.keywords.map((kw, i) => <span key={i} className={`text-sm font-black px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-50 text-gray-600 border-gray-300'}`}>#{kw}</span>)}
            </div>
          </div>

          <div className={`flex flex-col gap-6 px-10 py-8 rounded-[2rem] border shadow-xl ${isDarkMode ? 'bg-[#112240] border-slate-700 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/40'}`}>
            <div className={`grid grid-cols-2 gap-x-8 border-b pb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <div className={`flex flex-col pr-8 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>MARKET CAP</span>
                <div className="flex items-baseline">{formatMarketCapDetail(stock.marketCap)}</div>
              </div>
              <div className="flex flex-col pl-4 items-end">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>TOTAL RETURN</span>
                <span className={`text-2xl lg:text-4xl font-black leading-none ${
                  (stock.returnRate || 0) >= 0
                    ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                    : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                }`}>
                  {(stock.returnRate || 0) > 0 ? '+' : ''}{(stock.returnRate || 0).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-4">
              <div className={`flex flex-col pr-4 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PER</span>
                <div className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stock.per ? stock.per.toFixed(1) : '-'} <span className="text-sm font-bold ml-1">배</span>
                </div>
              </div>
              <div className={`flex flex-col px-4 border-r ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PBR</span>
                <div className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stock.pbr ? stock.pbr.toFixed(1) : '-'} <span className="text-sm font-bold ml-1">배</span>
                </div>
              </div>
              <div className="flex flex-col pl-4">
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>PSR</span>
                <div className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stock.psr ? stock.psr.toFixed(1) : '-'} <span className="text-sm font-bold ml-1">배</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="mb-16">
        <div className="flex justify-center mb-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full max-w-5xl py-3 px-8 rounded-full border-2 transition-all duration-300 flex items-center justify-between group hover:shadow-xl active:scale-[0.99] ${
              isExpanded
                ? (isDarkMode ? 'bg-primary/20 border-blue-500 text-primary-accent' : 'bg-blue-50 border-primary text-primary')
                : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary')
            }`}
          >
            <div className="flex-1 h-[1px] bg-current opacity-10" />
            <span className="mx-6 text-[15px] font-black tracking-widest uppercase">회사 개요</span>
            <div className="flex-1 h-[1px] bg-current opacity-10" />
            <svg className={`w-5 h-5 ml-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
            {/* Description Card */}
            <div className={`rounded-[3rem] p-10 lg:p-14 border shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-[#112240] border-slate-600 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/30'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">Company Insight</span>
                  <div className="h-[1px] flex-1 bg-primary/10" />
                </div>
                <div className="flex flex-col gap-6">
                  <h3 className={`text-xl lg:text-2xl font-black tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                    핵심 비즈니스 개요
                  </h3>
                  <div className={`text-[15px] lg:text-[17px] leading-relaxed font-bold border-l-4 pl-8 border-primary/30 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    " {stock.description} "
                  </div>
                </div>

                {/* 사업별 매출 비중 */}
                {stock.businessSegments && stock.businessSegments.length > 0 && (
                  <>
                    <div className={`mt-10 mb-8 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h4 className={`text-lg lg:text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                        사업별 매출 비중 <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(Revenue Mix)</span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[...stock.businessSegments].sort((a, b) => b.value - a.value).map((seg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-5 transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-300 bg-white'}`}>
                              {getSegmentIcon(seg.nameKr || seg.name, isDarkMode)}
                            </div>
                            <span className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>
                              {seg.value}<span className={`text-base font-bold ml-0.5 ${isDarkMode ? 'text-primary-accent/60' : 'text-primary/50'}`}>%</span>
                            </span>
                          </div>
                          <div className={`text-[13px] font-black leading-snug ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {seg.nameKr}
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                            {seg.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Briefing */}
              <div className={`rounded-[2.5rem] p-10 lg:p-12 border shadow-xl flex flex-col ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-200 shadow-gray-200/30'}`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-primary p-2 rounded-lg text-white shadow-lg">
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" /></svg>
                  </div>
                  <h3 className="text-[18px] font-black tracking-tight text-primary">AI 기업 활동 요약</h3>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-2 justify-center py-16">
                    {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                ) : aiBriefing ? (
                  <div className="space-y-8 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {aiBriefing.keywords.map((kw, i) => (
                        <span key={i} className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${isDarkMode ? 'border-blue-800 text-primary-accent bg-primary/20' : 'border-blue-200 text-primary bg-blue-50/50'}`}>
                          #{kw.replace('#', '')}
                        </span>
                      ))}
                    </div>
                    <div className={`relative p-8 rounded-[2rem] border shadow-sm ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50/30 border-gray-100'}`}>
                      <p className={`text-[14px] lg:text-[15px] font-bold tracking-tight leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                        " {aiBriefing.summary} "
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-300 font-black uppercase tracking-widest">No Analysis Available</div>
                )}
              </div>

              {/* Investment Points */}
              <div className={`rounded-[2.5rem] p-10 lg:p-12 bg-primary text-white shadow-2xl shadow-primary/30 flex flex-col border border-primary-dark`}>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1.5 h-6 bg-white/40 rounded-full" />
                  <h3 className="text-[20px] font-black tracking-tight">핵심 투자 가이드</h3>
                </div>
                <div className="space-y-10 flex-1 flex flex-col justify-center">
                  {stock.investmentPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-5 group">
                      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[17px] lg:text-[19px] font-black tracking-tight leading-tight">{point.title}</span>
                        <p className="text-[13px] font-bold text-white/70 mt-1 leading-snug max-w-[90%]">
                          {point.description}
                        </p>
                        <div className="h-[1px] w-8 mt-4 bg-white/10 rounded-full group-last:hidden" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={() => setIsExpanded(false)}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-black transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-primary'}`}
              >
                상세 정보 접기
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="mt-20">
        <div className="flex items-center gap-4 mb-10">
           <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>최신 뉴스 및 타임라인</h3>
           <div className={`flex-1 h-[1px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{timelineData.length} UPDATES</span>
        </div>

        {timelineData.length > 0 ? (
          <div className="space-y-10 max-w-5xl mx-auto">
            {timelineData.map((item, idx) => (
              <div
                key={idx}
                className={`group relative pl-12 pb-2 transition-all`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div className={`absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 ${item.isCMS ? 'bg-primary border-white shadow-md' : 'bg-gray-400 border-white'}`} />

                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                   <span className={`text-xl font-black font-mono tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{item.date}</span>
                   <div className="flex flex-wrap gap-2">
                     {item.keywords.map((kw, i) => (
                       <span key={i} className={`text-[11px] font-bold px-3 py-1 rounded-full border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-300'}`}>#{kw}</span>
                     ))}
                   </div>
                </div>

                <div
                  onClick={() => handleInsightClick(item)}
                  className={`p-8 lg:p-10 rounded-[2rem] border transition-all cursor-pointer hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-300 shadow-sm'} ${item.isCMS ? 'border-l-[10px] border-l-primary' : ''}`}
                >
                  <h4 className={`text-xl lg:text-2xl font-black mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <TextWithCMS text={item.title} isDarkMode={isDarkMode} isTitle={true} />
                  </h4>
                  <div className={`text-[16px] lg:text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                     <TextWithCMS text={item.content} isDarkMode={isDarkMode} hideBadge={true} />
                  </div>

                  {item.images && item.images.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {item.images.map((img, i) => (
                        <div key={i} className={`aspect-video rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8 flex justify-end">
                    <span className="text-xs font-black text-primary flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      AI 심층 분석 보기 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`py-32 text-center rounded-[3rem] border-2 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
             <p className="text-gray-300 font-black uppercase tracking-[0.3em]">No Timeline Available for this asset</p>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-primary-dark/40 backdrop-blur-md" onClick={() => setSelectedInsight(null)} />
          <div className={`relative w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#0a192f] border border-slate-700' : 'bg-white'}`}>
            <div className="p-10 lg:p-14 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                <span className="text-2xl font-black text-primary">{selectedInsight.date} INSIGHT</span>
                <button onClick={() => setSelectedInsight(null)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mb-12">
                <h2 className={`text-3xl font-black mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><TextWithCMS text={selectedInsight.title} isDarkMode={isDarkMode} /></h2>
                <div className={`p-8 rounded-[2rem] text-[17px] leading-relaxed font-bold whitespace-pre-wrap ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-50 text-gray-700'}`}><TextWithCMS text={selectedInsight.content} isDarkMode={isDarkMode} hideBadge={true} /></div>
              </div>

              {isAnalyzingIssue ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-black text-primary tracking-widest uppercase">Analyzing with Gemini 2.0</span>
                </div>
              ) : issueAnalysis && (
                <div className="space-y-12 animate-in slide-in-from-bottom-6">
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                       <span className="w-1.5 h-6 bg-primary rounded-full" />
                       <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>전문가 관점의 해석</h3>
                    </div>
                    <p className={`text-[17px] leading-relaxed font-bold p-8 rounded-[2rem] border ${isDarkMode ? 'bg-primary/10 border-blue-800 text-slate-200' : 'bg-blue-50/30 border-blue-100 text-gray-800'}`}>{issueAnalysis.interpretation}</p>
                  </section>

                  {issueAnalysis.glossary.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                         <span className="w-1.5 h-6 bg-primary rounded-full" />
                         <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>핵심 용어 정리</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {issueAnalysis.glossary.map((item, i) => (
                          <div key={i} className={`p-6 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-primary'}`}>
                            <dt className="text-primary font-black text-sm mb-2 uppercase tracking-tight">{item.term}</dt>
                            <dd className={`text-[14px] font-bold leading-snug ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{item.definition}</dd>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
            <div className={`p-8 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
               <button onClick={() => setSelectedInsight(null)} className="px-12 py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
