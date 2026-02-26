import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewMode, MainTab, SortKey, SortDirection } from '@/shared/types';

interface UIState {
  // 뷰 상태
  viewMode: ViewMode;
  activeTab: MainTab;
  isDarkMode: boolean;

  // 정렬 상태
  sortKey: SortKey;
  sortDirection: SortDirection;

  // 포트폴리오 확장 상태
  expandedPortfolios: string[];

  // 선택된 종목
  selectedStockId: string | null;

  // 새 자료 알림
  lastSeenResourcesAt: string | null;

  // 액션
  setViewMode: (mode: ViewMode) => void;
  setActiveTab: (tab: MainTab) => void;
  toggleDarkMode: () => void;
  setSort: (key: SortKey) => void;
  togglePortfolio: (id: string) => void;
  resetExpandedPortfolios: () => void;
  setSelectedStockId: (id: string | null) => void;
  resetUIState: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      viewMode: 'DASHBOARD',
      activeTab: 'PORTFOLIO',
      isDarkMode: false,
      sortKey: 'name',
      sortDirection: 'ASC',
      expandedPortfolios: [],
      selectedStockId: null,
      lastSeenResourcesAt: null,

      setViewMode: (mode) => set({ viewMode: mode }),

      setActiveTab: (tab) => {
        if (tab === 'RESOURCES') {
          set({ activeTab: tab, lastSeenResourcesAt: new Date().toISOString() });
        } else {
          set({ activeTab: tab });
        }
      },

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      setSort: (key) => {
        const { sortKey, sortDirection } = get();
        if (sortKey === key) {
          set({ sortDirection: sortDirection === 'ASC' ? 'DESC' : 'ASC' });
        } else {
          const defaultDir = (key === 'marketCapValue' || key === 'returnRate') ? 'DESC' : 'ASC';
          set({ sortKey: key, sortDirection: defaultDir });
        }
      },

      togglePortfolio: (id) => {
        const { expandedPortfolios } = get();
        const isExpanded = expandedPortfolios.includes(id);
        if (isExpanded) {
          set({ expandedPortfolios: expandedPortfolios.filter(p => p !== id) });
        } else {
          set({ expandedPortfolios: [...expandedPortfolios, id] });
        }
      },

      resetExpandedPortfolios: () => set({ expandedPortfolios: [] }),

      setSelectedStockId: (id) => set({ selectedStockId: id }),

      resetUIState: () => set({
        viewMode: 'DASHBOARD',
        activeTab: 'PORTFOLIO',
        expandedPortfolios: [],
        selectedStockId: null,
      }),
    }),
    {
      name: 'cms-ui-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode, lastSeenResourcesAt: state.lastSeenResourcesAt }),
    }
  )
);
