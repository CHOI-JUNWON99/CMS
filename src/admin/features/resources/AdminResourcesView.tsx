import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Client, DbResourceRow, Resource, ResourceCategory, ResourceFileType, Stock } from '@/shared/types';
import { supabase } from '@/shared/lib/supabase';
import { adminAction } from '@/shared/lib/adminApi';
import { toast, confirm, useAdminAuthStore } from '@/shared/stores';

interface AdminResourcesViewProps {
  onRefresh: () => void;
}

interface ResourceFormState {
  stockId: string;
  title: string;
  description: string;
  keywords: string;
  fileType: ResourceFileType | '';
  category: ResourceCategory;
  file: File | null;
  clientIds: string[];
  removeExistingFile: boolean;
}

const EMPTY_FORM: ResourceFormState = {
  stockId: '',
  title: '',
  description: '',
  keywords: '',
  fileType: '',
  category: '기업',
  file: null,
  clientIds: [],
  removeExistingFile: false,
};

const CATEGORY_OPTIONS: ResourceCategory[] = ['기업', '정책'];
const FILE_TYPE_OPTIONS: ResourceFileType[] = ['PDF', 'EXCEL', 'WORD', 'PPT'];
const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/resources/';

const toResource = (row: DbResourceRow): Resource => ({
  id: row.id,
  stockId: row.stock_id,
  title: row.title,
  description: row.description ?? '',
  keywords: row.keywords ?? [],
  fileType: row.file_type,
  category: row.category ?? '정책',
  date: row.date,
  fileSize: row.file_size ?? '',
  fileUrl: row.file_url ?? undefined,
  clientId: row.client_id ?? undefined,
  clientIds: row.client_ids ?? (row.client_id ? [row.client_id] : []),
  originalFilename: row.original_filename ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

const getFileTypeFromName = (fileName: string): ResourceFileType | null => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'xlsx' || ext === 'xls') return 'EXCEL';
  if (ext === 'docx' || ext === 'doc') return 'WORD';
  if (ext === 'pptx' || ext === 'ppt') return 'PPT';
  return null;
};

const getFileSizeLabel = (file: File) => (
  file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
);

const parseKeywords = (keywords: string) => keywords
  .split(',')
  .map((keyword) => keyword.trim())
  .filter(Boolean);

const extractStoragePath = (fileUrl?: string) => {
  if (!fileUrl) return null;
  const markerIndex = fileUrl.indexOf(STORAGE_PUBLIC_PREFIX);
  if (markerIndex < 0) return null;
  return decodeURIComponent(fileUrl.slice(markerIndex + STORAGE_PUBLIC_PREFIX.length));
};

const selectClassName = 'w-full appearance-none px-3 py-2 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-slate-600';

const AdminResourcesView: React.FC<AdminResourcesViewProps> = ({ onRefresh }) => {
  const getAdminCode = useAdminAuthStore((state) => state.getAdminCode);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formState, setFormState] = useState<ResourceFormState>(EMPTY_FORM);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('resources').select('*').order('date', { ascending: false });
      if (error) throw error;
      setResources(((data ?? []) as DbResourceRow[]).map(toResource));
    } catch (err) {
      console.error('자료실 로딩 실패:', err);
      toast.error('자료실을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase.rpc('get_active_clients');
        if (error) throw error;

        setClients(((data ?? []) as {
          id: string;
          name: string;
          code: string;
          description?: string;
          logo_url?: string;
          is_active: boolean;
        }[]).map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description ?? undefined,
          logoUrl: row.logo_url ?? undefined,
          isActive: row.is_active,
        })));
      } catch (err) {
        console.error('클라이언트 로딩 실패:', err);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const { data, error } = await supabase
          .from('stocks')
          .select('id, ticker, name, name_kr, sector, keywords')
          .order('name_kr');
        if (error) throw error;
        setStocks(((data ?? []) as {
          id: string;
          ticker: string;
          name: string;
          name_kr: string;
          sector: string;
          keywords: string[] | null;
        }[]).map((row) => ({
          id: row.id,
          ticker: row.ticker,
          name: row.name,
          nameKr: row.name_kr,
          sector: row.sector,
          keywords: row.keywords ?? [],
          investmentPoints: [],
          marketCap: '',
          marketCapValue: 0,
          price: 0,
          change: 0,
          description: '',
          issues: [],
        })));
      } catch (err) {
        console.error('종목 로딩 실패:', err);
      }
    };

    fetchStocks();
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const sortedResources = useMemo(
    () => [...resources].sort((a, b) => (b.updatedAt || b.createdAt || b.date).localeCompare(a.updatedAt || a.createdAt || a.date)),
    [resources],
  );

  const resetForm = useCallback(() => {
    setFormState(EMPTY_FORM);
    setEditingResource(null);
    setFileInputKey((prev) => prev + 1);
    setStockSearch('');
    setShowStockDropdown(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setFormState({
      stockId: resource.stockId ?? '',
      title: resource.title,
      description: resource.description,
      keywords: resource.keywords.join(', '),
      fileType: resource.fileType,
      category: resource.category,
      file: null,
      clientIds: resource.clientIds ?? (resource.clientId ? [resource.clientId] : []),
      removeExistingFile: false,
    });
    const stock = stocks.find((item) => item.id === resource.stockId);
    setStockSearch(stock ? `${stock.nameKr} (${stock.ticker})` : '');
    setFileInputKey((prev) => prev + 1);
    setShowModal(true);
  };

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return [];
    const query = stockSearch.toLowerCase();
    return stocks.filter((stock) =>
      stock.nameKr.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.ticker.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [stockSearch, stocks]);

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.id === formState.stockId) || null,
    [formState.stockId, stocks],
  );

  const selectStock = (stock: Stock) => {
    setFormState((prev) => ({ ...prev, stockId: stock.id }));
    setStockSearch(`${stock.nameKr} (${stock.ticker})`);
    setShowStockDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFormState((prev) => {
      if (!nextFile) return { ...prev, file: null };
      return {
        ...prev,
        file: nextFile,
        fileType: getFileTypeFromName(nextFile.name) ?? prev.fileType,
        removeExistingFile: false,
      };
    });
  };

  const removeExistingStorageFile = useCallback(async (fileUrl?: string) => {
    const storagePath = extractStoragePath(fileUrl);
    if (!storagePath) return;
    await supabase.storage.from('resources').remove([storagePath]);
  }, []);

  const uploadResourceFile = useCallback(async (resourceId: string, file: File) => {
    const filePath = `${resourceId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from('resources').upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from('resources').getPublicUrl(filePath);
    return {
      fileUrl: data.publicUrl,
      fileSize: getFileSizeLabel(file),
      originalFilename: file.name,
      fileType: getFileTypeFromName(file.name),
    };
  }, []);

  const persistResource = useCallback(async () => {
    if (!formState.title.trim() || !formState.description.trim()) {
      toast.warning('제목과 설명은 필수입니다.');
      return;
    }
    if (formState.category === '기업' && !formState.stockId) {
      toast.warning('기업 코멘트는 종목 선택이 필요합니다.');
      return;
    }

    setIsUploading(true);

    const resourceId = editingResource?.id ?? `res-${Date.now()}`;
    const previousFileUrl = editingResource?.fileUrl;
    let nextFileUrl = editingResource?.fileUrl ?? null;
    let nextFileSize = editingResource?.fileSize ?? '';
    let nextOriginalFilename = editingResource?.originalFilename ?? null;
    let nextFileType: ResourceFileType = formState.fileType || editingResource?.fileType || 'PDF';
    let uploadedFileUrl: string | null = null;

    try {
      if (formState.file) {
        const uploaded = await uploadResourceFile(resourceId, formState.file);
        uploadedFileUrl = uploaded.fileUrl;
        nextFileUrl = uploaded.fileUrl;
        nextFileSize = uploaded.fileSize;
        nextOriginalFilename = uploaded.originalFilename;
        nextFileType = uploaded.fileType || formState.fileType || 'PDF';
      } else if (formState.removeExistingFile) {
        nextFileUrl = null;
        nextFileSize = '';
        nextOriginalFilename = null;
      }

      const payload = {
        id: resourceId,
        stockId: formState.category === '기업' ? formState.stockId : null,
        title: formState.title.trim(),
        description: formState.description.trim(),
        keywords: parseKeywords(formState.keywords),
        fileType: nextFileType,
        category: formState.category,
        date: editingResource?.date ?? getTodayDate(),
        fileSize: nextFileSize,
        fileUrl: nextFileUrl,
        clientId: formState.clientIds.length === 1 ? formState.clientIds[0] : null,
        clientIds: formState.clientIds,
        originalFilename: nextOriginalFilename,
      };

      if (editingResource) {
        if (import.meta.env.PROD) {
          await adminAction('update_resource', { resourceId: editingResource.id, ...payload });
        } else {
          const adminCode = getAdminCode();
          const { error } = await supabase.rpc('update_resource', {
            admin_code: adminCode,
            p_id: editingResource.id,
            p_stock_id: payload.stockId,
            p_title: payload.title,
            p_description: payload.description,
            p_keywords: payload.keywords,
            p_file_type: payload.fileType,
            p_category: payload.category,
            p_file_size: payload.fileSize,
            p_file_url: payload.fileUrl,
            p_client_id: payload.clientId,
            p_client_ids: payload.clientIds,
            p_original_filename: payload.originalFilename,
          });
          if (error) throw error;
        }
      } else {
        if (import.meta.env.PROD) {
          await adminAction('add_resource', payload);
        } else {
          const adminCode = getAdminCode();
          const { error } = await supabase.rpc('add_resource', {
            admin_code: adminCode,
            p_id: payload.id,
            p_stock_id: payload.stockId,
            p_title: payload.title,
            p_description: payload.description,
            p_keywords: payload.keywords,
            p_file_type: payload.fileType,
            p_category: payload.category,
            p_date: payload.date,
            p_file_size: payload.fileSize,
            p_file_url: payload.fileUrl,
            p_client_id: payload.clientId,
            p_client_ids: payload.clientIds,
            p_original_filename: payload.originalFilename,
          });
          if (error) throw error;
        }
      }

      if (editingResource && (formState.file || formState.removeExistingFile) && previousFileUrl) {
        await removeExistingStorageFile(previousFileUrl);
      }

      toast.success(editingResource ? '자료가 수정되었습니다.' : '자료가 추가되었습니다.');
      closeModal();
      await loadResources();
      onRefresh();
    } catch (err) {
      if (uploadedFileUrl) {
        await removeExistingStorageFile(uploadedFileUrl).catch(() => undefined);
      }
      console.error('자료 저장 실패:', err);
      toast.error(editingResource ? '수정에 실패했습니다.' : '추가에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [
    closeModal,
    editingResource,
    formState,
    loadResources,
    onRefresh,
    removeExistingStorageFile,
    getAdminCode,
    uploadResourceFile,
  ]);

  const handleDeleteResource = async (resource: Resource) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;

    try {
      if (import.meta.env.PROD) {
        await adminAction('delete_resource', { resourceId: resource.id });
      } else {
        const adminCode = getAdminCode();
        const { error } = await supabase.rpc('delete_resource', {
          admin_code: adminCode,
          p_id: resource.id,
        });
        if (error) throw error;
      }

      await removeExistingStorageFile(resource.fileUrl);
      setResources((prev) => prev.filter((item) => item.id !== resource.id));
      toast.success('자료가 삭제되었습니다.');
      onRefresh();
    } catch (err) {
      console.error('삭제 실패:', err);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const getFileTypeStyle = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-900/30 text-red-400 border-red-800';
      case 'EXCEL': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
      case 'WORD': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'PPT': return 'bg-orange-900/30 text-orange-400 border-orange-800';
      default: return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setFormState((prev) => ({
      ...prev,
      clientIds: prev.clientIds.includes(clientId)
        ? prev.clientIds.filter((id) => id !== clientId)
        : [...prev.clientIds, clientId],
    }));
  };

  const getClientNames = (resource: Resource) => {
    const selectedIds = resource.clientIds ?? (resource.clientId ? [resource.clientId] : []);
    if (selectedIds.length === 0) return ['모두 공개'];
    return selectedIds.map((clientId) => clients.find((item) => item.id === clientId)?.name || '알 수 없음');
  };

  const existingFileLabel = editingResource?.originalFilename || editingResource?.fileUrl;
  const showExistingFile = Boolean(editingResource?.fileUrl && !formState.removeExistingFile && !formState.file);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white">자료실 코멘트 관리 ({resources.length}개)</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-slate-700 text-red-400 text-xs font-black hover:bg-red-900/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          코멘트 추가
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedResources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-black ${getFileTypeStyle(resource.fileType)}`}>
                  {resource.fileType}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      {resource.category}
                    </span>
                    {resource.stockId && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-900/20 text-blue-300 border border-blue-800/60">
                        {stocks.find((item) => item.id === resource.stockId)?.nameKr || resource.stockId}
                      </span>
                    )}
                    {getClientNames(resource).map((clientName) => (
                      <span
                        key={`${resource.id}-${clientName}`}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${clientName === '모두 공개' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}
                      >
                        {clientName}
                      </span>
                    ))}
                  </div>
                  <div className="font-bold text-white text-sm truncate">{resource.title}</div>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap mt-1">{resource.description}</div>
                  {resource.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {resource.keywords.map((keyword) => (
                        <span
                          key={`${resource.id}-${keyword}`}
                          className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500 flex-wrap">
                    <span>{resource.date}</span>
                    {resource.fileUrl ? <span>{resource.fileSize || '첨부파일 있음'}</span> : <span>첨부파일 없음</span>}
                    {resource.updatedAt && <span>수정됨</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(resource)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  수정
                </button>
                {resource.fileUrl && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white text-xs"
                  >
                    다운로드
                  </a>
                )}
                <button
                  onClick={() => handleDeleteResource(resource)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}

          {resources.length === 0 && (
            <div className="text-center py-20 text-slate-300 font-bold">
              등록된 자료가 없습니다.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#112240] rounded-2xl border border-slate-700 w-full max-w-2xl p-6 my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain">
            <h3 className="text-lg font-black text-white mb-6">
              {editingResource ? '코멘트 수정' : '새 코멘트 추가'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">공개 범위 *</label>
                <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={formState.clientIds.length === 0}
                      onChange={() => setFormState((prev) => ({ ...prev, clientIds: [] }))}
                      className="rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500"
                    />
                    <span className="font-bold">모두 공개</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clients.map((client) => (
                      <label
                        key={client.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          formState.clientIds.includes(client.id)
                            ? 'border-blue-500/60 bg-blue-900/20 text-white'
                            : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formState.clientIds.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="font-medium">{client.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">선택하지 않으면 모두 공개됩니다. 여러 소속을 동시에 선택할 수 있습니다.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">카테고리 *</label>
                <div className="relative">
                  <select
                    value={formState.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as ResourceCategory;
                      setFormState((prev) => ({
                        ...prev,
                        category: nextCategory,
                        stockId: nextCategory === '기업' ? prev.stockId : '',
                      }));
                      if (nextCategory !== '기업') {
                        setStockSearch('');
                        setShowStockDropdown(false);
                      }
                    }}
                    className={selectClassName}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {formState.category === '기업' && (
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-200 mb-1">기업 선택 *</label>
                  {selectedStock ? (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="min-w-0">
                        <div className="text-white text-sm font-bold truncate">{selectedStock.nameKr}</div>
                        <div className="text-[11px] text-slate-400">{selectedStock.ticker}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormState((prev) => ({ ...prev, stockId: '' }));
                          setStockSearch('');
                          setShowStockDropdown(true);
                        }}
                        className="text-slate-300 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => {
                          setStockSearch(e.target.value);
                          setShowStockDropdown(true);
                        }}
                        onFocus={() => setShowStockDropdown(true)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                        placeholder="종목명 또는 티커 검색"
                      />
                      {showStockDropdown && (
                        <div className="absolute z-20 w-full mt-1 max-h-56 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                          {stockSearch.trim() && filteredStocks.length > 0 ? (
                            filteredStocks.map((stock) => (
                              <button
                                key={stock.id}
                                type="button"
                                onClick={() => selectStock(stock)}
                                className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                              >
                                <div className="text-white text-sm font-bold">{stock.nameKr}</div>
                                <div className="text-[11px] text-slate-400">{stock.ticker}</div>
                              </button>
                            ))
                          ) : !stockSearch.trim() ? (
                            <div className="px-3 py-3 text-slate-400 text-sm">종목명 또는 티커를 입력하면 검색 결과가 표시됩니다.</div>
                          ) : (
                            <div className="px-3 py-2 text-slate-400 text-sm">검색 결과가 없습니다.</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">제목 *</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="자료 제목"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">설명 *</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="코멘트를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">키워드</label>
                <input
                  type="text"
                  value={formState.keywords}
                  onChange={(e) => setFormState((prev) => ({ ...prev, keywords: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="반도체, 중국소비, 실적"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">파일 형식</label>
                <div className="relative">
                  <select
                    value={formState.fileType}
                    onChange={(e) => setFormState((prev) => ({ ...prev, fileType: e.target.value as ResourceFileType | '' }))}
                    className={selectClassName}
                  >
                    <option value="">첨부파일 없음</option>
                    {FILE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">파일을 올리면 형식이 자동으로 맞춰집니다.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">파일 업로드</label>
                {showExistingFile && (
                  <div className="flex items-center justify-between gap-3 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-200 truncate">{existingFileLabel}</span>
                    <button
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, removeExistingFile: true, file: null }))}
                      className="text-[11px] text-red-400 hover:text-red-300 shrink-0"
                    >
                      파일 제거
                    </button>
                  </div>
                )}
                {editingResource?.fileUrl && formState.removeExistingFile && !formState.file && (
                  <div className="mb-2 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-800 text-[11px] text-amber-300">
                    기존 첨부파일이 제거됩니다.
                  </div>
                )}
                <input
                  key={fileInputKey}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-bold"
                />
                {formState.file && (
                  <p className="text-xs text-slate-300 mt-1">선택됨: {formState.file.name}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">첨부파일은 선택사항입니다. 올리지 않으면 코멘트만 등록됩니다.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={persistResource}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 ${
                  editingResource ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isUploading ? (editingResource ? '저장 중...' : '업로드 중...') : editingResource ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResourcesView;
