
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Stock, StockIssue, BusinessSegment } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface StockDetailProps {
  stock: Stock;
  onBack: () => void;
  isDarkMode: boolean;
}

interface UnifiedInsight {
  date: string;
  type: 'ISSUE' | 'COMMENT';
  title: string;
  content: string;
  keywords: string[];
}

interface IssueAnalysis {
  interpretation: string;
  glossary: { term: string; definition: string }[];
}

interface AiBriefing {
  summary: string;
  keywords: string[];
}

// [CMS증권] 텍스트를 배지로 변환하는 컴포넌트
const TextWithCMS: React.FC<{ text: string; isDarkMode: boolean; isTitle?: boolean }> = ({ text, isDarkMode, isTitle }) => {
  if (!text.includes('[CMS증권]')) return <>{text}</>;

  const parts = text.split('[CMS증권]');
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className={`inline-flex items-center justify-center bg-primary text-white font-black px-1.5 py-0.5 rounded text-[10px] leading-none mx-1 align-baseline shadow-sm tracking-tighter ${isTitle ? 'scale-110' : 'scale-100'}`}>
              CMS
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

const StockDetail: React.FC<StockDetailProps> = ({ stock, onBack, isDarkMode }) => {
  const [aiBriefing, setAiBriefing] = useState<AiBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedInsight, setSelectedInsight] = useState<UnifiedInsight | null>(null);
  const [isAnalyzingIssue, setIsAnalyzingIssue] = useState(false);
  const [issueAnalysis, setIssueAnalysis] = useState<IssueAnalysis | null>(null);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const glossaryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const timelineData = useMemo(() => {
    const combined: UnifiedInsight[] = [];
    if (stock.issues) {
      stock.issues.forEach(issue => {
        combined.push({
          date: issue.date || '25/01/01',
          type: issue.title?.includes('[CMS증권]') ? 'COMMENT' : 'ISSUE',
          title: issue.title || '',
          content: issue.content,
          keywords: issue.keywords || []
        });
      });
    }
    return combined.sort((a, b) => b.date.localeCompare(a.date));
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
        const prompt = `기업(${stock.nameKr})의 타임라인 정보를 분석하여 2-3문장 내외의 한국어 요약을 작성해줘. 타임라인 정보: ${timelineData.map(item => `[${item.date}] ${item.title}`).join(', ')}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
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
    setActiveTerm(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `분석 대상: ${insight.title} - ${insight.content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretation: { type: Type.STRING },
              glossary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } } } }
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
        <span className="text-xl md:text-3xl font-black tracking-tight">{joPart}</span>
        <span className="text-xl md:text-2xl font-black mx-1">조</span>
        <span className="text-xl md:text-3xl font-black tracking-tight ml-2">{okPart}</span>
        <span className="text-xl md:text-2xl font-black ml-1">억</span>
      </span>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto pb-20 relative px-4 md:px-0">
      <div className="sticky top-16 z-40 py-4 mb-6 pointer-events-none">
        <button onClick={onBack} className={`inline-flex items-center transition-all group py-2.5 px-5 rounded-2xl backdrop-blur-xl border-2 pointer-events-auto shadow-md ${isDarkMode ? 'bg-slate-900/60 border-slate-600 hover:bg-slate-900/80' : 'bg-white/80 border-gray-200 hover:bg-gray-50'}`}>
          <svg className={`w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          <span className={`text-[15px] font-black tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>목록으로 돌아가기</span>
        </button>
      </div>

      {/* Header Section */}
      <div className={`mb-10 pb-8 border-b-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className={`text-[12px] md:text-[13px] font-mono font-black tracking-wider px-3 py-1.5 rounded-lg border-2 inline-block ${isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>{stock.ticker}</div>
            <div>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.name}</h1>
              <div className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{stock.nameKr}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className={`text-xs md:text-sm font-black px-4 py-2 rounded-xl border-2 ${isDarkMode ? 'bg-primary text-blue-100 border-blue-500/50' : 'bg-primary text-white border-primary shadow-md shadow-primary/20'}`}>{stock.sector}</span>
              {stock.keywords.map((kw, i) => <span key={i} className={`text-xs md:text-sm font-black px-4 py-2 rounded-xl border-2 transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-600 hover:border-blue-400' : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-primary hover:text-primary'}`}>#{kw}</span>)}
            </div>
          </div>
          <div className={`flex items-center w-full md:w-auto min-w-[360px] px-10 py-7 rounded-[2rem] border-2 transition-all ${isDarkMode ? 'bg-[#112240] border-slate-600 shadow-2xl shadow-black/40' : 'bg-white border-gray-300 shadow-xl'}`}>
            <div className="flex-1 flex flex-col">
              <span className={`text-[12px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>시가총액</span>
              <div className="flex items-baseline">{formatMarketCapDetail(stock.marketCap)}</div>
            </div>
            <div className="w-0.5 h-12 bg-gray-300 dark:bg-slate-600 mx-8" />
            <div className="flex-1 flex flex-col items-end">
              <span className={`text-[12px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>데일리</span>
              <span className={`text-3xl md:text-4xl font-black leading-none ${stock.change >= 0 ? (isDarkMode ? 'text-primary-accent' : 'text-primary') : (isDarkMode ? 'text-cyan-400' : 'text-cyan-600')}`}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Left: Business Overview & AI Summary */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className={`flex flex-col rounded-[2.5rem] border-2 shadow-2xl overflow-hidden h-full transition-all ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-white border-gray-300'}`}>
              
              {/* Top Section: Business Overview */}
              <div className="p-10 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>기업 개요</h3>
                </div>
                <div className={`leading-relaxed text-[17px] font-semibold pl-5 border-l-4 ${isDarkMode ? 'text-slate-200 border-slate-700' : 'text-gray-700 border-gray-100'}`}>
                  {stock.description}
                </div>
              </div>

              {/* Bottom Section: AI Activity Summary */}
              <div className={`p-10 md:p-12 border-t-2 mt-auto ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="flex items-center gap-3 mb-8">
                   <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-primary/40' : 'bg-primary shadow-md shadow-primary/20'}`}>
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-primary-accent' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L9 9L1 12L9 15L12 23L15 15L23 12L15 9L12 1Z" /></svg>
                  </div>
                  <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>AI 기업 활동 요약</h3>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center gap-3 justify-center py-12">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-.5s]" />
                  </div>
                ) : aiBriefing ? (
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-3">
                      {aiBriefing.keywords.map((kw, i) => (
                        <span key={i} className={`text-xs md:text-sm font-black px-4 py-2 rounded-full border-2 shadow-sm ${isDarkMode ? 'bg-primary/40 text-blue-200 border-blue-500/50' : 'bg-white text-primary border-blue-200 hover:border-primary transition-colors'}`}>
                          #{kw.replace('#', '')}
                        </span>
                      ))}
                    </div>
                    <div className={`relative p-8 rounded-3xl border-2 ${isDarkMode ? 'bg-slate-900/80 border-slate-600 shadow-inner' : 'bg-white border-blue-200 shadow-xl'}`}>
                      <p className={`text-[16px] md:text-[18px] font-bold tracking-tight leading-relaxed italic ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        " {aiBriefing.summary} "
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 opacity-40 text-sm font-black uppercase tracking-[0.2em]">No Analysis Available</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Investment Guide */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className={`rounded-[2.5rem] border-2 p-10 md:p-12 shadow-2xl h-full flex flex-col transition-all overflow-hidden ${isDarkMode ? 'bg-[#112240] border-slate-600' : 'bg-primary text-white border-blue-950 shadow-primary/40'}`}>
              
              {/* Title inside the card */}
              <div className="flex items-center gap-3 mb-10">
                <span className={`w-2 h-6 rounded-full ${isDarkMode ? 'bg-primary' : 'bg-white shadow-sm'}`} />
                <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-white'}`}>핵심 투자 가이드</h3>
              </div>

              <div className="flex flex-col gap-10">
                {stock.investmentPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-5 group animate-in slide-in-from-right-6" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className={`mt-1.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:rotate-12 ${isDarkMode ? 'bg-blue-500/30' : 'bg-white/10 border border-white/20'}`}>
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-300' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className={`text-[18px] md:text-[20px] font-black tracking-tight leading-snug ${isDarkMode ? 'text-white' : 'text-white'}`}>
                        {point}
                      </span>
                      <div className={`h-[4px] w-16 mt-3 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${isDarkMode ? 'bg-blue-400' : 'bg-white/50'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* UPDATED: Business Portfolio Hub & Spoke Section */}
        {stock.businessSegments && stock.businessSegments.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-1.5 h-8 bg-primary rounded-full" />
              <h3 className={`text-2xl font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>비즈니스 포트폴리오</h3>
            </div>
            
            <div className={`relative rounded-[3rem] border-2 p-10 md:p-14 md:pb-24 transition-all shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-end ${isDarkMode ? 'bg-[#0a192f] border-slate-700 shadow-black/40' : 'bg-gray-50 border-gray-300'}`}>
              
              {/* Connector Lines Layer (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
                {stock.businessSegments.map((seg, i) => {
                  const count = stock.businessSegments!.length;
                  const angle = (i - (count - 1) / 2) * (140 / (count - 1 || 1));
                  const rad = (angle - 90) * (Math.PI / 180);
                  const dist = 180;
                  const x1 = 50; // Center %
                  const y1 = 75; // Center %
                  const x2 = 50 + (Math.cos(rad) * dist) / 10;
                  const y2 = 75 + (Math.sin(rad) * dist) / 10;
                  
                  return (
                    <line 
                      key={i}
                      x1={`${x1}%`} y1={`${y1}%`} 
                      x2={`${x2}%`} y2={`${y2}%`} 
                      stroke={isDarkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.15)'}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  );
                })}
              </svg>

              <div className="relative flex flex-col items-center justify-center">
                
                {/* Satellite Business Bubbles (Positioned Above Hub) */}
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 w-full max-w-5xl mb-24 md:mb-32">
                  {stock.businessSegments.map((seg, i) => {
                    const baseSize = 100;
                    const size = baseSize + (seg.value * 1.2);
                    return (
                      <div 
                        key={i} 
                        className={`group relative rounded-full flex flex-col items-center justify-center text-center p-5 shadow-xl border-[3px] transition-all duration-700 hover:scale-110 hover:-translate-y-3 cursor-default animate-in zoom-in slide-in-from-bottom-10 ${
                          isDarkMode 
                            ? 'bg-slate-800/90 border-slate-600' 
                            : 'bg-white border-gray-200'
                        }`}
                        style={{ 
                          width: `${size}px`, 
                          height: `${size}px`,
                          animationDelay: `${i * 100}ms`
                        }}
                      >
                        {/* Segment Value Badge - Small Color indicator */}
                        <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 flex items-center justify-center shadow-lg ${seg.color || 'bg-blue-600'}`}>
                          <span className="text-[10px] font-black text-white">{seg.value}%</span>
                        </div>

                        <div className="flex flex-col items-center pointer-events-none">
                          <span className={`text-[13px] md:text-[15px] font-black leading-tight break-keep mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{seg.nameKr}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-tighter opacity-40 ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>{seg.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Central Company Hub (The Anchor) */}
                <div className={`z-10 w-44 h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center text-center p-6 shadow-[0_30px_70px_rgba(15,23,42,0.4)] border-4 border-white dark:border-slate-600 transform transition-transform hover:scale-105 duration-500 animate-in fade-in zoom-in ${isDarkMode ? 'bg-[#112240]' : 'bg-primary'}`}>
                  <div className="flex flex-col">
                    <span className="text-white font-black text-xl md:text-2xl leading-tight mb-1">{stock.nameKr}</span>
                    <span className="text-blue-300 font-bold text-xs md:text-sm uppercase tracking-widest">{stock.ticker}</span>
                    <div className="w-8 h-1 bg-white/20 mx-auto mt-3 rounded-full" />
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Timeline Section */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h3 className={`text-2xl font-black flex items-center gap-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}><span className="w-1.5 h-8 bg-primary rounded-full" />INTEGRATED NEWS & INSIGHTS</h3>
          </div>
          
          <div className={`relative md:border-2 md:rounded-[3rem] md:px-10 md:py-14 p-0 ${isDarkMode ? 'md:bg-[#0a192f] md:border-slate-700 md:shadow-2xl' : 'md:bg-gray-50 md:border-gray-300 md:shadow-xl'}`}>
            <div className={`absolute left-5 md:left-12 top-5 bottom-5 w-[3px] ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
            
            <div className="space-y-12 md:space-y-16">
              {timelineData.length > 0 ? timelineData.map((item, idx) => (
                <div key={idx} className="relative pl-10 md:pl-20 group cursor-pointer" onClick={() => handleInsightClick(item)}>
                  <div className={`absolute left-[6.5px] md:-left-[11px] top-1.5 w-8 h-8 flex items-center justify-center rounded-full z-10 transition-transform group-hover:scale-125 border-4 ${isDarkMode ? 'bg-[#0a192f] border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${item.type === 'COMMENT' ? 'bg-primary' : (isDarkMode ? 'bg-slate-400' : 'bg-gray-400')}`} />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-5 mb-4">
                    <span className={`text-base font-black tracking-tighter ${item.type === 'COMMENT' ? 'text-primary' : (isDarkMode ? 'text-slate-300' : 'text-gray-500')}`}>
                      {item.date}
                    </span>
                    <span className={`text-xs w-fit px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-primary text-white shadow-md shadow-primary/20`}>
                      News
                    </span>
                  </div>

                  <div className={`p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-500 transform group-hover:-translate-y-1 ${item.type === 'COMMENT' ? (isDarkMode ? 'bg-slate-800 border-blue-500/40 border-l-8 border-l-blue-900 shadow-2xl' : 'bg-white border-blue-200 shadow-2xl border-l-8 border-l-blue-900') : (isDarkMode ? 'bg-slate-800/50 border-slate-600 hover:border-slate-400 shadow-xl' : 'bg-white border-gray-300 hover:border-primary shadow-lg')}`}>
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
                      {item.keywords.map((kw, i) => (
                        <span key={i} className={`text-[10px] md:text-sm font-black px-3 py-1 md:px-4 md:py-1.5 rounded-xl border-2 ${isDarkMode ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          #{kw}
                        </span>
                      ))}
                    </div>
                    {item.title && (
                      <h4 className={`text-lg md:text-2xl font-black mb-5 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <TextWithCMS text={item.title} isDarkMode={isDarkMode} isTitle={true} />
                      </h4>
                    )}
                    <div className={`text-[14px] md:text-[17px] font-bold leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-slate-100' : 'text-gray-700'}`}>
                      <TextWithCMS text={item.content} isDarkMode={isDarkMode} />
                    </div>
                    <div className="mt-8 flex justify-end">
                      <span className={`text-[11px] font-black flex items-center gap-2 ${isDarkMode ? 'text-primary-accent' : 'text-primary'} opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0`}>
                        AI 분석 및 용어 보기 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center opacity-30 font-black text-xl">데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Modal Style Adjustment */}
      {selectedInsight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col ${isDarkMode ? 'bg-[#0a192f] border-slate-600' : 'bg-white border-gray-300'}`}>
            <div className={`p-8 border-b-2 flex items-start justify-between ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <div className="space-y-2 pr-10">
                <div className="flex items-center gap-3 mb-2"><span className={`text-xs font-black px-3 py-1 rounded-lg shadow-md bg-primary text-white`}>News</span><span className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>{selectedInsight.date}</span></div>
                <h2 className={`text-2xl md:text-3xl font-black leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <TextWithCMS text={selectedInsight.title} isDarkMode={isDarkMode} isTitle={true} />
                </h2>
              </div>
              <button onClick={() => setSelectedInsight(null)} className={`p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12">
              <section><h4 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>Original Content</h4><div className={`p-8 rounded-3xl border-2 leading-relaxed text-[16px] font-bold whitespace-pre-wrap ${isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white shadow-inner' : 'bg-gray-50 border-gray-300 text-gray-800 shadow-lg'}`}>
                <TextWithCMS text={selectedInsight.content} isDarkMode={isDarkMode} />
              </div></section>
              <section className="relative"><div className="flex items-center gap-3 mb-5"><div className="w-3 h-3 bg-primary rounded-full animate-pulse" /><h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-primary-accent' : 'text-primary'}`}>AI Deep Insight</h4></div><div className={`p-8 rounded-3xl border-2 border-primary shadow-2xl shadow-primary/10 ${isDarkMode ? 'bg-primary/20 text-white font-bold' : 'bg-blue-50 text-gray-900'}`}>{isAnalyzingIssue ? <div className="flex items-center gap-4 py-4 justify-center"><div className="w-3 h-3 bg-primary rounded-full animate-bounce" /><div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-.3s]" /><div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-.5s]" /></div> : issueAnalysis ? <p className="text-[15px] md:text-[16px] leading-relaxed font-black">{issueAnalysis.interpretation}</p> : <p className="text-sm opacity-50">분석 실패</p>}</div></section>
            </div>
            <div className={`p-8 border-t-2 ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'bg-gray-50 border-gray-100'}`}><button onClick={() => setSelectedInsight(null)} className="w-full py-5 rounded-[1.5rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all transform active:scale-[0.98]">확인</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
