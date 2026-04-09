import React, { useState, useEffect, useRef } from 'react';

// 용어 툴팁 컴포넌트
export const TermWithTooltip: React.FC<{ term: string; definition: string; isDarkMode: boolean }> = ({ term, definition, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-block" ref={tooltipRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`font-black underline decoration-solid decoration-1 underline-offset-4 transition-colors ${
          isDarkMode ? 'text-primary-accent decoration-blue-400/60' : 'text-primary decoration-primary/50'
        }`}
      >
        {term}
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[60] w-64 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
          <div className={`p-4 rounded-xl shadow-2xl border text-[13px] leading-relaxed font-bold ${
            isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-primary-dark border-primary text-white'
          }`}>
            <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">용어 풀이</div>
            {definition}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-primary-dark border-primary'
            }`} />
          </div>
        </div>
      )}
    </span>
  );
};

// [CMS증권] 텍스트를 배지로 변환하고 전문 용어를 하이라이트하는 컴포넌트
export const TextWithCMS: React.FC<{ text: string; isDarkMode: boolean; isTitle?: boolean; hideBadge?: boolean; glossary: Record<string, string> }> = ({ text, isDarkMode, isTitle, hideBadge, glossary }) => {
  const highlightTerms = (inputText: string) => {
    const terms = Object.keys(glossary);
    if (terms.length === 0) return inputText;

    const regex = new RegExp(`(${terms.join('|')})`, 'g');
    const parts = inputText.split(regex);

    return parts.map((part, i) => {
      if (glossary[part]) {
        return <TermWithTooltip key={i} term={part} definition={glossary[part]} isDarkMode={isDarkMode} />;
      }
      return part;
    });
  };

  if (!text.includes('[CMS증권]')) {
    return <>{highlightTerms(text)}</>;
  }

  const cmsParts = text.split('[CMS증권]');
  return (
    <>
      {cmsParts.map((part, i) => (
        <React.Fragment key={i}>
          {highlightTerms(part)}
          {i < cmsParts.length - 1 && !hideBadge && (
            <span className={`inline-flex items-center justify-center bg-black text-white font-black px-1.5 py-0.5 rounded text-[10px] leading-none mx-1 align-baseline shadow-sm tracking-tighter ${isTitle ? 'scale-110' : 'scale-100'}`}>
              CMS
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
