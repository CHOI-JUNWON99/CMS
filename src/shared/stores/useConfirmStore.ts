import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface ConfirmStore extends ConfirmState {
  show: (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }) => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
  close: () => void;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: '확인',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  variant: 'danger',
  onConfirm: null,
  onCancel: null,
};

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  ...initialState,

  show: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title ?? '확인',
        message: options.message,
        confirmText: options.confirmText ?? '확인',
        cancelText: options.cancelText ?? '취소',
        variant: options.variant ?? 'danger',
        onConfirm: () => {
          get().close();
          resolve(true);
        },
        onCancel: () => {
          get().close();
          resolve(false);
        },
      });
    });
  },

  confirm: () => {
    const { onConfirm } = get();
    if (onConfirm) onConfirm();
  },

  cancel: () => {
    const { onCancel } = get();
    if (onCancel) onCancel();
  },

  close: () => {
    set(initialState);
  },
}));

// 편의 함수 - Promise 기반
export const confirm = {
  /**
   * 삭제 확인 다이얼로그
   */
  delete: (itemName?: string) =>
    useConfirmStore.getState().show({
      title: '삭제 확인',
      message: itemName
        ? `정말 "${itemName}"을(를) 삭제하시겠습니까?`
        : '정말 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
    }),

  /**
   * 일반 확인 다이얼로그
   */
  action: (message: string, options?: { title?: string; confirmText?: string }) =>
    useConfirmStore.getState().show({
      title: options?.title ?? '확인',
      message,
      confirmText: options?.confirmText ?? '확인',
      cancelText: '취소',
      variant: 'warning',
    }),

  /**
   * 커스텀 확인 다이얼로그
   */
  custom: (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }) => useConfirmStore.getState().show(options),
};
