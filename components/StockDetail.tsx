import React, { useState, useEffect, useMemo } from 'react';
import { Stock, BusinessSegment, IssueImage } from '../types';
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

const BusinessHubAndSpoke: React.FC<{ segments: BusinessSegment[]; companyName: string; isDarkMode: boolean }> = ({ segments, companyName, isDarkMode }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const sortedSegments = useMemo(() =>
    [...segments].sort((a, b) => b.value - a.value),
    [segments]
  );

  // SVG Configuration
  const width = 800;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const hubRadius = 70;
  const spokeDistance = 220;

  // 색상 팔레트
  const colors = [
    { main: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
    { main: '#10B981', light: '#D1FAE5', dark: '#065F46' },
    { main: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
    { main: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6' },
    { main: '#EC4899', light: '#FCE7F3', dark: '#9D174D' },
    { main: '#06B6D4', light: '#CFFAFE', dark: '#155E75' },
  ];

  const getSpokeRadius = (value: number) => {
    const minR = 35;
    const maxR = 65;
    const maxVal = Math.max(...segments.map(s => s.value));
    const minVal = Math.min(...segments.map(s => s.value));
    if (maxVal === minVal) return 50;
    return minR + ((value - minVal) / (maxVal - minVal)) * (maxR - minR);
  };

  return (
    <div className={`mt-16 p-8 lg:p-16 rounded-[3rem] lg:rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#0F172A] border-slate-700 shadow-black/60' : 'bg-gradient-to-br from-slate-50 to-white border-gray-100 shadow-gray-200/50'}`}>
      {/* Background Grid Pattern */}
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${isDarkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-5 mb-12">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-xl shadow-primary/20">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2m0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 7h.01M11 7h.01M15 7h.01" /></svg>
        </div>
        <div>
          <h3 className={`text-2xl lg:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-primary'}`}>비즈니스 포트폴리오 구조</h3>
          <p className={`text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.25em] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Strategic Hub & Revenue Spokes</p>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex justify-center items-center py-10 overflow-visible min-h-[450px]">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible max-w-full h-auto">
          <defs>
            <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
          </defs>

          {/* Layer 1: Connection Lines (맨 아래) */}
          <g className="lines-layer">
            {sortedSegments.map((segment, idx) => {
              const angle = (idx * (360 / sortedSegments.length)) - 90;
              const rad = (angle * Math.PI) / 180;
              const spokeR = getSpokeRadius(segment.value);
              const isSelected = selectedIdx === idx;
              const color = colors[idx % colors.length];

              const startX = centerX + Math.cos(rad) * hubRadius;
              const startY = centerY + Math.sin(rad) * hubRadius;
              const endX = centerX + Math.cos(rad) * (spokeDistance - spokeR);
              const endY = centerY + Math.sin(rad) * (spokeDistance - spokeR);

              return (
                <line
                  key={`line-${idx}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isSelected ? color.main : (isDarkMode ? '#334155' : '#E2E8F0')}
                  strokeWidth={2}
                  strokeDasharray="8,8"
                  className="transition-all duration-300"
                  opacity={selectedIdx !== null && !isSelected ? 0.2 : (isSelected ? 0.6 : 1)}
                />
              );
            })}
          </g>

          {/* Layer 2: Hub Circle */}
          <g className="hub-layer drop-shadow-2xl">
            <circle
              cx={centerX}
              cy={centerY}
              r={hubRadius}
              fill="url(#hubGrad)"
            />
            <text x={centerX} y={centerY - 5} textAnchor="middle" className="fill-white font-black text-[15px] tracking-tighter">
              {companyName}
            </text>
            <text x={centerX} y={centerY + 15} textAnchor="middle" className="fill-white/50 font-bold text-[9px] uppercase tracking-[0.2em]">
              Strategic Core
            </text>
          </g>

          {/* Layer 3: Spoke Circles (원만) */}
          <g className="circles-layer">
            {sortedSegments.map((segment, idx) => {
              const angle = (idx * (360 / sortedSegments.length)) - 90;
              const rad = (angle * Math.PI) / 180;
              const spokeR = getSpokeRadius(segment.value);
              const spokeX = centerX + Math.cos(rad) * spokeDistance;
              const spokeY = centerY + Math.sin(rad) * spokeDistance;
              const isSelected = selectedIdx === idx;
              const color = colors[idx % colors.length];

              return (
                <g
                  key={`spoke-${idx}`}
                  className="cursor-pointer"
                  onClick={() => setSelectedIdx(isSelected ? null : idx)}
                  style={{
                    transform: isSelected ? `scale(1.08)` : 'scale(1)',
                    transformOrigin: `${spokeX}px ${spokeY}px`,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <circle
                    cx={spokeX}
                    cy={spokeY}
                    r={spokeR}
                    fill={isDarkMode ? (isSelected ? color.main : '#1E293B') : (isSelected ? color.main : 'white')}
                    stroke={isSelected ? color.main : (isDarkMode ? '#475569' : color.main)}
                    strokeWidth={isSelected ? 5 : 3}
                    className="transition-all duration-300"
                    opacity={selectedIdx !== null && !isSelected ? 0.3 : 1}
                  />
                  <text
                    x={spokeX}
                    y={spokeY + 6}
                    textAnchor="middle"
                    className={`font-black pointer-events-none transition-all duration-300 ${isSelected ? 'fill-white' : (isDarkMode ? 'fill-slate-300' : 'fill-primary')}`}
                    style={{ fontSize: `${spokeR * 0.45}px` }}
                    opacity={selectedIdx !== null && !isSelected ? 0.3 : 1}
                  >
                    {segment.value}%
                  </text>
                </g>
              );
            })}
          </g>

          {/* Layer 4: Labels (맨 위 - 선에 가려지지 않음) */}
          <g className="labels-layer">
            {sortedSegments.map((segment, idx) => {
              const angle = (idx * (360 / sortedSegments.length)) - 90;
              const rad = (angle * Math.PI) / 180;
              const spokeR = getSpokeRadius(segment.value);
              const spokeX = centerX + Math.cos(rad) * spokeDistance;
              const spokeY = centerY + Math.sin(rad) * spokeDistance;
              const isSelected = selectedIdx === idx;

              return (
                <text
                  key={`label-${idx}`}
                  x={spokeX}
                  y={spokeY + spokeR + 25}
                  textAnchor="middle"
                  className={`font-black text-[12px] tracking-tight transition-all duration-300 pointer-events-none ${isSelected ? (isDarkMode ? 'fill-primary-accent' : 'fill-primary') : (isDarkMode ? 'fill-slate-500' : 'fill-gray-400')}`}
                  opacity={selectedIdx !== null && !isSelected ? 0.2 : 1}
                >
                  {segment.nameKr}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Detail Overlay Card */}
      {selectedIdx !== null && (
        <div className="absolute bottom-10 left-10 right-10 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`p-8 rounded-[2.5rem] border shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center gap-8 ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-gray-100 shadow-primary/10'}`}>
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left min-w-[150px]">
              <span className={`text-4xl font-black mb-1 ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>{sortedSegments[selectedIdx].value}%</span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Revenue Weight</span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <h4 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {sortedSegments[selectedIdx].nameKr} <span className="text-sm font-bold opacity-30 ml-2">{sortedSegments[selectedIdx].name}</span>
              </h4>

              <div className="flex flex-wrap gap-2">
                {((sortedSegments[selectedIdx] as any).brands || []).map((brand: string, i: number) => (
                  <span key={i} className={`px-3 py-1 rounded-lg text-[11px] font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                    {brand}
                  </span>
                ))}
              </div>

              {(sortedSegments[selectedIdx] as any).coreFocus && (
                <p className={`text-[14px] font-medium leading-relaxed mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <span className="font-black text-primary mr-2 uppercase text-[10px] tracking-widest">Focus:</span>
                  {(sortedSegments[selectedIdx] as any).coreFocus}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedIdx(null)}
              className={`p-3 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-6 flex flex-wrap justify-center gap-x-6 lg:gap-x-10 gap-y-3 px-4 py-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
        {sortedSegments.map((s, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(selectedIdx === i ? null : i)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${selectedIdx === i ? 'bg-white shadow-md scale-105' : 'hover:bg-white/50'} ${isDarkMode && selectedIdx === i ? 'bg-slate-700' : ''}`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colors[i % colors.length].main }}
            />
            <span className={`text-[11px] lg:text-[12px] font-bold ${selectedIdx === i ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-slate-400' : 'text-gray-500')}`}>
              {s.nameKr}
            </span>
            <span className={`text-[10px] lg:text-[11px] font-black ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              ({s.value}%)
            </span>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex justify-center">
        <p className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
          * 각 노드를 클릭하여 상세 사업 현황을 확인하실 수 있습니다.
        </p>
      </div>
    </div>
  );
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
        <button onClick={onBack} className={`pointer-events-auto inline-flex items-center transition-all group py-2.5 px-6 rounded-2xl backdrop-blur-xl border shadow-sm bg-white/80 hover:bg-gray-50 active:scale-95 ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
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

          <div className={`flex flex-col gap-6 px-10 py-8 rounded-[2rem] border bg-white shadow-xl ${isDarkMode ? 'bg-[#112240] border-slate-700 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-200/40'}`}>
            <div className="grid grid-cols-2 gap-x-8 border-b border-gray-100 dark:border-slate-700 pb-6">
              <div className="flex flex-col pr-8 border-r border-gray-100 dark:border-slate-700">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 text-gray-400`}>MARKET CAP</span>
                <div className="flex items-baseline">{formatMarketCapDetail(stock.marketCap)}</div>
              </div>
              <div className="flex flex-col pl-4 items-end">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 text-gray-400`}>TOTAL RETURN</span>
                <span className={`text-2xl lg:text-4xl font-black leading-none ${
                  stock.change >= 0
                    ? (isDarkMode ? 'text-rose-400' : 'text-rose-600')
                    : (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                }`}>
                  {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-4">
              <div className="flex flex-col pr-4 border-r border-gray-100 dark:border-slate-700">
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400`}>PER</span>
                <div className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stock.per ? stock.per.toFixed(1) : '-'} <span className="text-sm font-bold ml-1">배</span>
                </div>
              </div>
              <div className="flex flex-col px-4 border-r border-gray-100 dark:border-slate-700">
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400`}>PBR</span>
                <div className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stock.pbr ? stock.pbr.toFixed(1) : '-'} <span className="text-sm font-bold ml-1">배</span>
                </div>
              </div>
              <div className="flex flex-col pl-4">
                <span className={`text-[13px] font-black uppercase tracking-[0.2em] mb-1.5 text-gray-400`}>PSR</span>
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
            <div className={`rounded-[3rem] p-10 lg:p-14 border bg-white shadow-2xl relative overflow-hidden ${isDarkMode ? 'bg-[#112240] border-slate-600 shadow-black/40' : 'border-gray-200 shadow-gray-200/30'}`}>
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
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Briefing */}
              <div className={`rounded-[2.5rem] p-10 lg:p-12 border bg-white shadow-xl flex flex-col ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'border-gray-200 shadow-gray-200/30'}`}>
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

            {/* SVG Portfolio Visualization */}
            {stock.businessSegments && stock.businessSegments.length > 0 && (
              <BusinessHubAndSpoke
                segments={stock.businessSegments}
                companyName={stock.nameKr}
                isDarkMode={isDarkMode}
              />
            )}

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
                  className={`p-8 lg:p-10 rounded-[2rem] border bg-white transition-all cursor-pointer hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-300 shadow-sm'} ${item.isCMS ? 'border-l-[10px] border-l-primary' : ''}`}
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
