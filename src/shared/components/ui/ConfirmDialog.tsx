import React, { useEffect, useCallback } from 'react';
import { useConfirmStore } from '@/shared/stores';

const ConfirmDialog: React.FC = () => {
  const { isOpen, title, message, confirmText, cancelText, variant, confirm, cancel } =
    useConfirmStore();

  // ESC 키로 취소
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        cancel();
      }
    },
    [isOpen, cancel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          iconBg: 'bg-red-900/50',
          confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          iconBg: 'bg-yellow-900/50',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        };
      case 'info':
      default:
        return {
          icon: (
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          iconBg: 'bg-blue-900/50',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-y-auto"
      aria-labelledby="confirm-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 배경 오버레이 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/70 transition-opacity"
          aria-hidden="true"
          onClick={cancel}
        />

        {/* 다이얼로그 패널 */}
        <div className="relative transform overflow-hidden rounded-xl bg-[#112240] border border-slate-700 shadow-xl transition-all w-full max-w-md animate-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* 아이콘 */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                {styles.icon}
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 pt-0.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-bold text-white"
                >
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-800/50">
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={confirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
