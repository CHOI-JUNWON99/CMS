import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { toast, confirm } from '@/shared/stores';
import { adminAction, adminEtfApi } from '@/shared/lib/adminApi';
import { DbEtfRow, ETF } from '@/shared/types';
import ETFExcelUploadModal from './components/ETFExcelUploadModal';
import { parseEtfExcel } from './utils/etfExcelParser';

const isProd = import.meta.env.PROD;
const ETF_CLIENT_CODE = 'etf';

const emptyForm = {
  code: '',
  nameEn: '',
  closePriceCny: '',
  minimumPurchaseUnit: '',
  minimumPurchaseAmountKrw: '',
  listingDate: '',
  aumCnyMillion: '',
  aumKrwBillion: '',
  benchmarkNameEn: '',
  categoryLarge: '',
  categorySmall: '',
  ter: '',
  dividendYield: '',
  avgTradingValueYtdBillion: '',
  nav: '',
  return1M: '',
  return3M: '',
  return6M: '',
  return1Y: '',
  sector: '',
  volume: '',
  summary: '',
  isActive: true,
};

type EtfFormState = typeof emptyForm;

const mapEtfRow = (row: DbEtfRow): ETF => ({
  id: row.id,
  clientId: row.client_id,
  code: row.code,
  nameEn: row.name_en,
  closePriceCny: row.close_price_cny,
  minimumPurchaseUnit: row.minimum_purchase_unit,
  minimumPurchaseAmountKrw: row.minimum_purchase_amount_krw,
  listingDate: row.listing_date,
  aumCnyMillion: row.aum_cny_million,
  aumKrwBillion: row.aum_krw_billion,
  benchmarkNameEn: row.benchmark_name_en,
  categoryLarge: row.category_large,
  categorySmall: row.category_small,
  ter: row.ter,
  dividendYield: row.dividend_yield,
  avgTradingValueYtdBillion: row.avg_trading_value_ytd_billion,
  nav: row.nav,
  return1M: row.return_1m,
  return3M: row.return_3m,
  return6M: row.return_6m,
  return1Y: row.return_1y,
  sector: row.sector,
  volume: row.volume,
  summary: row.summary,
  isActive: row.is_active ?? false,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const toPayload = (form: EtfFormState, clientId: string) => ({
  client_id: clientId,
  code: form.code.trim(),
  name_en: form.nameEn.trim(),
  close_price_cny: toNullableNumber(form.closePriceCny),
  minimum_purchase_unit: toNullableNumber(form.minimumPurchaseUnit),
  minimum_purchase_amount_krw: toNullableNumber(form.minimumPurchaseAmountKrw),
  listing_date: form.listingDate.trim() || null,
  aum_cny_million: toNullableNumber(form.aumCnyMillion),
  aum_krw_billion: toNullableNumber(form.aumKrwBillion),
  benchmark_name_en: form.benchmarkNameEn.trim() || null,
  category_large: form.categoryLarge.trim() || null,
  category_small: form.categorySmall.trim() || null,
  ter: toNullableNumber(form.ter),
  dividend_yield: toNullableNumber(form.dividendYield),
  avg_trading_value_ytd_billion: toNullableNumber(form.avgTradingValueYtdBillion),
  nav: toNullableNumber(form.nav),
  return_1m: toNullableNumber(form.return1M),
  return_3m: toNullableNumber(form.return3M),
  return_6m: toNullableNumber(form.return6M),
  return_1y: toNullableNumber(form.return1Y),
  sector: form.sector.trim() || null,
  volume: toNullableNumber(form.volume),
  summary: form.summary.trim() || null,
  is_active: form.isActive,
  updated_at: new Date().toISOString(),
});

const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? '-' : value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: digits });

const AdminETFPage: React.FC = () => {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [etfClientId, setEtfClientId] = useState<string | null>(null);
  const [etfClientName, setEtfClientName] = useState<string>('ETF');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEtf, setEditingEtf] = useState<ETF | null>(null);
  const [formState, setFormState] = useState<EtfFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    updated: number;
    errors: { row: number; reason: string }[];
    duplicates: { row: number; firstRow: number; key: string }[];
  } | null>(null);

  const reloadEtfs = async () => {
    if (!etfClientId) {
      setEtfs([]);
      return;
    }

    const { data, error } = await supabase
      .from('etfs')
      .select('*')
      .eq('client_id', etfClientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    setEtfs(((data || []) as DbEtfRow[]).map(mapEtfRow));
  };

  useEffect(() => {
    const fetchEtfs = async () => {
      try {
        const { data: clientRow, error: clientError } = await supabase
          .from('clients')
          .select('id, name')
          .eq('code', ETF_CLIENT_CODE)
          .maybeSingle();

        if (clientError) throw clientError;
        if (!clientRow?.id) {
          setEtfClientId(null);
          setEtfs([]);
          toast.warning(`ETF 전용 소속(code: ${ETF_CLIENT_CODE})이 아직 없습니다.`);
          return;
        }

        setEtfClientId(clientRow.id);
        setEtfClientName(clientRow.name || 'ETF');

        const { data, error } = await supabase
          .from('etfs')
          .select('*')
          .eq('client_id', clientRow.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setEtfs(((data || []) as DbEtfRow[]).map(mapEtfRow));
      } catch (error) {
        console.error('ETF 로딩 실패:', error);
        toast.error('ETF 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtfs();
  }, []);

  const filteredEtfs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return etfs;
    return etfs.filter((etf) =>
      [etf.code, etf.nameEn, etf.sector, etf.categoryLarge, etf.categorySmall]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [etfs, searchQuery]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingEtf(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowEditModal(true);
  };

  const openEditModal = (etf: ETF) => {
    setEditingEtf(etf);
    setFormState({
      code: etf.code,
      nameEn: etf.nameEn,
      closePriceCny: etf.closePriceCny?.toString() || '',
      minimumPurchaseUnit: etf.minimumPurchaseUnit?.toString() || '',
      minimumPurchaseAmountKrw: etf.minimumPurchaseAmountKrw?.toString() || '',
      listingDate: etf.listingDate || '',
      aumCnyMillion: etf.aumCnyMillion?.toString() || '',
      aumKrwBillion: etf.aumKrwBillion?.toString() || '',
      benchmarkNameEn: etf.benchmarkNameEn || '',
      categoryLarge: etf.categoryLarge || '',
      categorySmall: etf.categorySmall || '',
      ter: etf.ter?.toString() || '',
      dividendYield: etf.dividendYield?.toString() || '',
      avgTradingValueYtdBillion: etf.avgTradingValueYtdBillion?.toString() || '',
      nav: etf.nav?.toString() || '',
      return1M: etf.return1M?.toString() || '',
      return3M: etf.return3M?.toString() || '',
      return6M: etf.return6M?.toString() || '',
      return1Y: etf.return1Y?.toString() || '',
      sector: etf.sector || '',
      volume: etf.volume?.toString() || '',
      summary: etf.summary || '',
      isActive: etf.isActive,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formState.code.trim() || !formState.nameEn.trim()) {
      toast.warning('코드와 명칭(영문)은 필수입니다.');
      return;
    }
    if (!etfClientId) {
      toast.warning(`먼저 ETF 전용 소속(code: ${ETF_CLIENT_CODE})을 생성해주세요.`);
      return;
    }

    setIsSubmitting(true);
    const payload = toPayload(formState, etfClientId);

    try {
      if (editingEtf) {
        if (isProd) {
          await adminEtfApi.update(editingEtf.id, payload);
        } else {
          const { error } = await supabase.from('etfs').update(payload).eq('id', editingEtf.id);
          if (error) throw error;
        }
        toast.success('ETF가 수정되었습니다.');
      } else {
        if (isProd) {
          await adminEtfApi.create(payload);
        } else {
          const { error } = await supabase.from('etfs').insert(payload);
          if (error) throw error;
        }
        toast.success('ETF가 추가되었습니다.');
      }

      await reloadEtfs();
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('ETF 저장 실패:', error);
      toast.error('ETF 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (etf: ETF) => {
    const confirmed = await confirm.custom({
      title: 'ETF 삭제',
      message: `"${etf.nameEn}" ETF를 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      if (isProd) {
        await adminEtfApi.delete(etf.id);
      } else {
        const { error } = await supabase.from('etfs').delete().eq('id', etf.id);
        if (error) throw error;
      }
      setEtfs((prev) => prev.filter((item) => item.id !== etf.id));
      toast.success('ETF가 삭제되었습니다.');
    } catch (error) {
      console.error('ETF 삭제 실패:', error);
      toast.error('ETF 삭제에 실패했습니다.');
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadResult(null);
    setIsSubmitting(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseEtfExcel(buffer);

      if (parsed.rows.length === 0) {
        setUploadResult({ inserted: 0, updated: 0, errors: parsed.errors, duplicates: parsed.duplicates });
        return;
      }
      if (!etfClientId) {
        toast.warning(`먼저 ETF 전용 소속(code: ${ETF_CLIENT_CODE})을 생성해주세요.`);
        return;
      }

      const rowsWithClientId = parsed.rows.map((row) => ({
        ...row,
        client_id: etfClientId,
      }));

      if (isProd) {
        const result = await adminAction<{ inserted: number; updated: number; errors: { row: number; reason: string }[] }>('bulk_upsert_etfs', {
          data: rowsWithClientId as unknown as Record<string, unknown>[],
        });
        setUploadResult({
          inserted: result.inserted ?? 0,
          updated: result.updated ?? 0,
          errors: [...parsed.errors, ...(result.errors || [])],
          duplicates: parsed.duplicates,
        });
      } else {
        const serverErrors: { row: number; reason: string }[] = [];
        const { data: existingRows, error: existingError } = await supabase
          .from('etfs')
          .select('client_id, code')
          .eq('client_id', etfClientId)
          .in('code', rowsWithClientId.map((item) => item.code));

        if (existingError) throw existingError;

        const existingKeys = new Set(
          ((existingRows || []) as Array<{ client_id: string; code: string }>).map((row) => `${row.client_id}::${row.code}`)
        );

        const { error: upsertError } = await supabase
          .from('etfs')
          .upsert(
            rowsWithClientId.map((item) => ({ ...item, updated_at: new Date().toISOString() })),
            { onConflict: 'client_id,code' }
          );

        if (upsertError) throw upsertError;

        let inserted = 0;
        let updated = 0;
        for (const item of rowsWithClientId) {
          const key = `${item.client_id}::${item.code}`;
          if (existingKeys.has(key)) updated++;
          else inserted++;
        }

        setUploadResult({
          inserted,
          updated,
          errors: [...parsed.errors, ...serverErrors],
          duplicates: parsed.duplicates,
        });
      }

      await reloadEtfs();
      toast.success('ETF 엑셀 업로드가 완료되었습니다.');
    } catch (error) {
      console.error('ETF 업로드 실패:', error);
      toast.error('ETF 업로드에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields: Array<{ key: keyof EtfFormState; label: string; type?: string }> = [
    { key: 'code', label: '코드' },
    { key: 'nameEn', label: '명칭(영문)' },
    { key: 'closePriceCny', label: '종가(위안)', type: 'number' },
    { key: 'minimumPurchaseUnit', label: '최소매수단위(주)', type: 'number' },
    { key: 'minimumPurchaseAmountKrw', label: '최소매수금액(원)', type: 'number' },
    { key: 'listingDate', label: '상장일', type: 'date' },
    { key: 'aumCnyMillion', label: 'AUM(CNY 백만 위안)', type: 'number' },
    { key: 'aumKrwBillion', label: 'AUM(KRW억원)', type: 'number' },
    { key: 'benchmarkNameEn', label: '벤치마크 명칭(영문)' },
    { key: 'categoryLarge', label: '대분류' },
    { key: 'categorySmall', label: '소분류' },
    { key: 'ter', label: 'TER*', type: 'number' },
    { key: 'dividendYield', label: '배당률', type: 'number' },
    { key: 'avgTradingValueYtdBillion', label: '일평균 거래대금(YTD,억원)', type: 'number' },
    { key: 'nav', label: 'NAV', type: 'number' },
    { key: 'return1M', label: '1M(%)', type: 'number' },
    { key: 'return3M', label: '3M(%)', type: 'number' },
    { key: 'return6M', label: '6M(%)', type: 'number' },
    { key: 'return1Y', label: '1Y(%)', type: 'number' },
    { key: 'sector', label: '섹터' },
    { key: 'volume', label: '거래량', type: 'number' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">ETF 관리</h1>
          <p className="mt-1 text-sm text-slate-400">ETF 목록, 노출 여부, 상세 정보를 관리하고 엑셀로 일괄 업로드합니다.</p>
          <p className="mt-2 text-xs font-bold text-slate-500">고정 소속: {etfClientName} ({ETF_CLIENT_CODE})</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowUploadModal(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            엑셀 업로드
          </button>
          <button onClick={openCreateModal} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
            ETF 추가
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-900/30 px-3 py-1 text-xs font-black text-red-400">{etfs.length}개</span>
            <span className="text-sm font-bold text-slate-300">활성 {etfs.filter((etf) => etf.isActive).length}개</span>
            {!etfClientId && <span className="text-xs font-bold text-amber-300">ETF 전용 소속이 필요합니다</span>}
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="코드, 명칭, 섹터, 분류 검색..."
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
          />
        </div>

        {uploadResult && (
          <div className="mt-4 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
              <span className="text-emerald-300">신규 {uploadResult.inserted}건</span>
              <span className="text-blue-300">업데이트 {uploadResult.updated}건</span>
              {uploadResult.duplicates.length > 0 && <span className="text-amber-300">엑셀 중복 {uploadResult.duplicates.length}건</span>}
              {uploadResult.errors.length > 0 && <span className="text-red-300">오류 {uploadResult.errors.length}건</span>}
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-700/30 bg-red-950/20 p-3">
                <p className="mb-2 text-xs font-black text-red-300">오류 상세</p>
                <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-200">
                  {uploadResult.errors.map((error, index) => (
                    <div key={`${error.row}-${index}`}>
                      {error.row}행: {error.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {uploadResult.duplicates.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-700/30 bg-amber-950/20 p-3">
                <p className="mb-2 text-xs font-black text-amber-300">중복 상세</p>
                <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-200">
                  {uploadResult.duplicates.map((duplicate, index) => (
                    <div key={`${duplicate.key}-${index}`}>
                      {duplicate.row}행: {duplicate.key} (최초 {duplicate.firstRow}행)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/70">
                  <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">코드</th>
                    <th className="px-4 py-3">명칭</th>
                    <th className="px-4 py-3">섹터</th>
                    <th className="px-4 py-3">AUM(KRW)</th>
                    <th className="px-4 py-3">1Y</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {filteredEtfs.map((etf) => (
                    <tr key={etf.id} className="text-sm text-slate-200">
                      <td className="px-4 py-4 font-mono font-black text-red-300">{etf.code}</td>
                      <td className="px-4 py-4">
                        <div className="font-black text-white">{etf.nameEn}</div>
                        <div className="mt-1 text-xs text-slate-400">{etf.benchmarkNameEn || etf.categoryLarge || '-'}</div>
                      </td>
                      <td className="px-4 py-4">{etf.sector || '-'}</td>
                      <td className="px-4 py-4">{formatNumber(etf.aumKrwBillion, 1)}</td>
                      <td className="px-4 py-4">{etf.return1Y === null || etf.return1Y === undefined ? '-' : `${etf.return1Y.toFixed(2)}%`}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${etf.isActive ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          {etf.isActive ? '노출 중' : '숨김'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(etf)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
                            수정
                          </button>
                          <button onClick={() => handleDelete(etf)} className="rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/30">
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEtfs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm font-bold text-slate-400">
                        등록된 ETF가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ETFExcelUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onFileSelect={handleFileSelect} />

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#112240] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{editingEtf ? 'ETF 수정' : 'ETF 추가'}</h3>
                <p className="mt-1 text-xs text-slate-400">엑셀 없이도 개별 ETF 정보를 수정할 수 있습니다.</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {fields.map((field) => (
                <label key={field.key} className={field.key === 'nameEn' || field.key === 'benchmarkNameEn' ? 'xl:col-span-2' : ''}>
                  <span className="mb-1 block text-xs font-bold text-slate-200">{field.label}</span>
                  <input
                    type={field.type || 'text'}
                    value={String(formState[field.key] ?? '')}
                    onChange={(e) => setFormState((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-slate-500 focus:outline-none"
                  />
                </label>
              ))}

              <label className="md:col-span-2 xl:col-span-3">
                <span className="mb-1 block text-xs font-bold text-slate-200">ETF개요</span>
                <textarea
                  rows={5}
                  value={formState.summary}
                  onChange={(e) => setFormState((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) => setFormState((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-red-500"
              />
              <span className="text-sm font-bold text-white">사용자 페이지에 노출</span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminETFPage;
