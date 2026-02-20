import React from 'react';
import { Stock, InvestmentPoint, BusinessSegment, StockIssue } from '@/shared/types';
import {
  BasicInfoSection,
  BusinessSegmentSection,
  InvestmentPointSection,
  AiSummarySection,
  IssueSection,
} from './components';

interface AdminStockDetailProps {
  stock: Stock;
  onBack: () => void;
  onRefresh: () => void;
}

/**
 * AdminStockDetail 컴포넌트
 *
 * 리팩토링 후:
 * - 기존 1,139줄 → 약 70줄 (94% 감소)
 * - 16개 useState → 0개 (서브 컴포넌트로 분리)
 * - 단일 책임 원칙 준수: 레이아웃 및 데이터 전달만 담당
 *
 * 서브 컴포넌트:
 * - BasicInfoSection: 기본 정보 편집 + 종목 삭제 (~190줄)
 * - BusinessSegmentSection: 사업부문 CRUD (~280줄)
 * - InvestmentPointSection: 투자포인트 CRUD (~180줄)
 * - AiSummarySection: AI 요약 생성/저장 (~180줄)
 * - IssueSection: 뉴스/이슈 CRUD (~270줄)
 * - IconPickerModal: 아이콘 선택 모달 (~180줄)
 */
const AdminStockDetail: React.FC<AdminStockDetailProps> = ({ stock, onBack, onRefresh }) => {
  // 투자포인트 데이터 변환 (id가 있는 것만 필터링)
  const investmentPoints = (stock.investmentPoints || [])
    .filter((p): p is InvestmentPoint & { id: string } => !!(p as { id?: string }).id)
    .map((p) => ({
      id: (p as { id: string }).id,
      title: p.title,
      description: p.description,
    }));

  // 사업부문 데이터 변환 (id가 있는 것만 필터링)
  const businessSegments = (stock.businessSegments || [])
    .filter((s): s is BusinessSegment & { id: string } => !!s.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      nameKr: s.nameKr,
      value: s.value,
      iconUrls: s.iconUrls,
    }));

  // 이슈 데이터 변환 (id가 있는 것만 필터링)
  const issues = (stock.issues || [])
    .filter((i): i is StockIssue & { id: string } => !!(i as { id?: string }).id)
    .map((i) => ({
      id: (i as { id: string }).id,
      title: i.title,
      content: i.content,
      keywords: i.keywords || [],
      date: i.date,
      isCMS: i.isCMS || false,
    }));

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* 기본 정보 (헤더 + 기본 정보 폼 + 종목 삭제) */}
      <BasicInfoSection stock={stock} onRefresh={onRefresh} onBack={onBack} />

      {/* 사업부문 */}
      <BusinessSegmentSection stockId={stock.id} businessSegments={businessSegments} onRefresh={onRefresh} />

      {/* AI 기업활동 요약 */}
      <AiSummarySection
        stockId={stock.id}
        stockNameKr={stock.nameKr}
        aiSummary={stock.aiSummary}
        aiSummaryKeywords={stock.aiSummaryKeywords}
        issues={issues}
        onRefresh={onRefresh}
      />

      {/* 투자 포인트 */}
      <InvestmentPointSection stockId={stock.id} investmentPoints={investmentPoints} onRefresh={onRefresh} />

      {/* 뉴스 / 이슈 */}
      <IssueSection stockId={stock.id} issues={issues} onRefresh={onRefresh} />
    </div>
  );
};

export default AdminStockDetail;
