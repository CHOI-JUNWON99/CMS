import React from 'react';
import { useToastStore, Toast as ToastType } from '@/shared/stores';

const ToastIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
};

const getToastStyles = (type: ToastType['type']) => {
  const base = 'border-l-4';
  switch (type) {
    case 'success':
      return `${base} border-green-500 bg-green-900/90`;
    case 'error':
      return `${base} border-red-500 bg-red-900/90`;
    case 'warning':
      return `${base} border-yellow-500 bg-yellow-900/90`;
    case 'info':
    default:
      return `${base} border-blue-500 bg-blue-900/90`;
  }
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
        animate-in slide-in-from-right duration-300
        ${getToastStyles(toast.type)}
      `}
    >
      <ToastIcon type={toast.type} />
      <p className="flex-1 text-sm text-white font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
