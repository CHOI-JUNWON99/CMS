import React from 'react';

export interface FeedItem {
  id: string;
  stockId: string;
  stockName: string;
  stockTicker: string;
  isCMS: boolean;
  title: string;
  content: string;
  keywords: string[];
  date: string;
  images?: { url: string; caption?: string }[];
}

interface IssueCardProps {
  item: FeedItem;
  onEdit: (item: FeedItem) => void;
  onDelete: (issueId: string) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ item, onEdit, onDelete }) => {
  return (
    <div
      className="relative pl-10 lg:pl-16 pb-20 group border-l-[3px] border-slate-700"
    >
      {/* 타임라인 도트 */}
      <div
        className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 transition-all group-hover:scale-125 z-10 ${
          item.isCMS
            ? 'bg-red-500 border-[#0a192f] shadow-xl'
            : 'bg-slate-500 border-[#0a192f] shadow-lg'
        }`}
      />

      {/* 헤더: 날짜, 종목, 버튼 */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-lg lg:text-2xl font-black tracking-tighter text-white">
              {item.date}
            </span>
            <span className="text-xs px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-red-600 text-white shadow-lg">
              News
            </span>
            {item.isCMS && (
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black">
                CMS증권
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              삭제
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base lg:text-lg font-black text-white">
            {item.stockName}
          </span>
          <span className="text-[12px] font-mono font-black tracking-widest px-2 py-0.5 rounded border-2 bg-slate-800 text-slate-300 border-slate-600">
            {item.stockTicker}
          </span>
        </div>
      </div>

      {/* 카드 본문 */}
      <div
        className={`rounded-[2rem] p-6 lg:p-8 border-2 transition-all duration-300 hover:-translate-y-1 ${
          item.isCMS
            ? 'bg-slate-800 border-red-500/40 border-l-8 border-l-red-500 shadow-2xl'
            : 'bg-[#112240] border-slate-600 hover:border-red-500 shadow-xl'
        }`}
      >
        {/* 키워드 */}
        {item.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.keywords.map((kw, i) => (
              <span
                key={i}
                className="text-[11px] font-black px-3 py-1 rounded-xl border-2 bg-slate-900 text-slate-100 border-slate-700"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* 제목 */}
        {item.title && (
          <h4 className="text-lg lg:text-xl font-black mb-4 tracking-tight leading-tight text-white">
            {item.title}
          </h4>
        )}

        {/* 내용 */}
        <p className="text-[14px] lg:text-[15px] leading-relaxed whitespace-pre-wrap font-bold text-slate-300 line-clamp-4">
          {item.content}
        </p>

        {/* 이미지 */}
        {item.images && item.images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {item.images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-video rounded-xl overflow-hidden border border-slate-700"
              >
                <img
                  src={img.url}
                  alt="뉴스 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
