import { DbIBOpinionRow, IBOpinion } from '@/shared/types';

function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase();
}

type IBSearchItem = IBOpinion | DbIBOpinionRow;

function getStockName(opinion: IBSearchItem): string {
  return 'stockName' in opinion ? opinion.stockName : opinion.stock_name;
}

function getOpinion(opinion: IBSearchItem): string | null {
  return 'opinion' in opinion ? opinion.opinion : null;
}

function getComment(opinion: IBSearchItem): string | null {
  return 'comment' in opinion ? opinion.comment : null;
}

function getAnalyst(opinion: IBSearchItem): string | null {
  return 'analyst' in opinion ? opinion.analyst : null;
}

export function matchesIBOpinionSearch(opinion: IBSearchItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    getStockName(opinion),
    opinion.ticker,
    opinion.sector,
    opinion.ib,
    getOpinion(opinion),
    getComment(opinion),
    getAnalyst(opinion),
  ].some((value) => normalize(value).includes(normalizedQuery));
}

export function filterIBOpinions<T extends IBSearchItem>(opinions: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return opinions;

  return opinions.filter((opinion) => matchesIBOpinionSearch(opinion, normalizedQuery));
}
