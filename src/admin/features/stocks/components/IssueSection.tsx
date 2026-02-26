import React, { useState } from 'react';
import { useAddIssue, useUpdateIssue, useDeleteIssue } from '@/features/issues';
import { supabase } from '@/shared/lib/supabase';
import { toast, confirm } from '@/shared/stores';
import IssueModal from '@/admin/features/issues/components/IssueModal';
import { FeedItem } from '@/admin/features/issues/components/IssueCard';
import { ImageUpload } from '@/admin/features/issues/components/ImageUploader';

interface Issue {
  id: string;
  title?: string;
  content: string;
  keywords: string[];
  date: string;
  isCMS: boolean;
  images?: { url: string; caption?: string }[];
}

interface IssueFormData {
  id?: string;
  stockId: string;
  title: string;
  content: string;
  keywords: string;
  date: string;
  isCMS: boolean;
  existingImages?: string[];
}

interface Props {
  stock: { id: string; nameKr: string; ticker: string };
  issues: Issue[];
  onRefresh: () => void;
}

const IssueSection: React.FC<Props> = ({ stock, issues, onRefresh }) => {
  const addMutation = useAddIssue();
  const updateMutation = useUpdateIssue();
  const deleteMutation = useDeleteIssue();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAdd = async (data: IssueFormData, imageUploads: ImageUpload[]) => {
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const img of imageUploads) {
        const fileName = `issues/${stock.ticker}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error } = await supabase.storage.from('images').upload(fileName, img.file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      await addMutation.mutateAsync({
        stockId: stock.id,
        title: data.title || undefined,
        content: data.content,
        keywords: data.keywords.split(',').map(k => k.trim()).filter(k => k),
        date: data.date,
        isCMS: data.isCMS,
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });

      setShowAddModal(false);
      toast.success('뉴스가 추가되었습니다.');
      onRefresh();
    } catch {
      toast.error('추가 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (data: IssueFormData, imageUploads: ImageUpload[]) => {
    if (!data.id) return;
    setIsUploading(true);
    try {
      const allImageUrls = [...(data.existingImages || [])];

      for (const img of imageUploads) {
        const fileName = `issues/${stock.ticker}/${data.id}/${Date.now()}-${img.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error } = await supabase.storage.from('images').upload(fileName, img.file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          allImageUrls.push(urlData.publicUrl);
        }
      }

      await updateMutation.mutateAsync({
        id: data.id,
        stockId: stock.id,
        title: data.title || undefined,
        content: data.content,
        keywords: data.keywords.split(',').map(k => k.trim()).filter(k => k),
        date: data.date,
        isCMS: data.isCMS,
        images: allImageUrls,
      });

      setShowEditModal(false);
      setEditingItem(null);
      toast.success('뉴스가 수정되었습니다.');
      onRefresh();
    } catch {
      toast.error('수정 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (issueId: string) => {
    const confirmed = await confirm.delete();
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id: issueId, stockId: stock.id });
      toast.success('뉴스가 삭제되었습니다.');
      onRefresh();
    } catch {
      toast.error('삭제 실패');
    }
  };

  const openEditModal = (issue: Issue) => {
    const feedItem: FeedItem = {
      id: issue.id,
      stockId: stock.id,
      stockName: stock.nameKr,
      stockTicker: stock.ticker,
      isCMS: issue.isCMS,
      title: issue.title || '',
      content: issue.content,
      keywords: issue.keywords,
      date: issue.date,
      images: issue.images,
    };
    setEditingItem(feedItem);
    setShowEditModal(true);
  };

  return (
    <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-red-400 tracking-wider">
          뉴스 / 이슈 ({issues.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-xs font-black hover:bg-red-900/50"
        >
          + 뉴스 추가
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`p-5 rounded-xl border ${
              issue.isCMS
                ? 'bg-red-900/20 border-red-800/50'
                : 'bg-slate-800/50 border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">{issue.date}</span>
                {issue.isCMS && (
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black">
                    CMS
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEditModal(issue)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(issue.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
            {issue.title && (
              <div className="font-bold text-white text-sm mb-1">{issue.title}</div>
            )}
            <div className="text-xs text-slate-200 whitespace-pre-wrap">{issue.content}</div>
            {issue.images && issue.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {issue.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-lg overflow-hidden border border-slate-700"
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
            {issue.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {issue.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 추가 모달 */}
      <IssueModal
        mode="add"
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        stocks={[]}
        defaultStock={stock}
        isUploading={isUploading}
      />

      {/* 수정 모달 */}
      <IssueModal
        mode="edit"
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleUpdate}
        stocks={[]}
        defaultStock={stock}
        editItem={editingItem || undefined}
        isUploading={isUploading}
      />
    </section>
  );
};

export default IssueSection;
