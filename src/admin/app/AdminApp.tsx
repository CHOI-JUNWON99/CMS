import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/shared/stores';
import { useSlidingSession } from '@/shared/hooks/useSlidingSession';
import { ToastContainer, ConfirmDialog } from '@/shared/components/ui';
import AdminGate from './AdminGate';
import { AdminHeader } from '@/admin/shared/components';
import AdminPortfolioPage from '@/admin/features/portfolios/AdminPortfolioPage';
import AdminStocksPage from '@/admin/features/stocks/AdminStocksPage';
import AdminIssuesPage from '@/admin/features/issues/AdminIssuesPage';
import AdminResourcesPage from '@/admin/features/resources/AdminResourcesPage';
import AdminGlossaryPage from '@/admin/features/glossary/AdminGlossaryPage';
import AdminSettingsPage from '@/admin/features/settings/AdminSettingsPage';
import AdminAnalyticsPage from '@/admin/features/analytics/AdminAnalyticsPage';

const AdminApp: React.FC = () => {
  const storeIsAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const expiresAt = useAdminAuthStore((state) => state.expiresAt);
  const logout = useAdminAuthStore((state) => state.logout);
  const extendSession = useAdminAuthStore((state) => state.extendSession);
  const isLoading = useAdminAuthStore((state) => state.isLoading);
  const restoreSession = useAdminAuthStore((state) => state.restoreSession);
  const isAuthenticated = storeIsAuthenticated && expiresAt !== null && Date.now() < expiresAt;

  // Sliding Session: 활동 감지 시 자동 갱신
  useSlidingSession({ isAuthenticated, extendSession, logout });

  // 세션 복원
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 세션 만료 체크 (1분마다)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const state = useAdminAuthStore.getState();
      if (!state.isAuthenticated || !state.expiresAt || Date.now() >= state.expiresAt) {
        logout();
      }
    };

    const id = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, logout]);

  const handleAuthenticated = () => {
    // 인메모리 스토어이므로 reload 대신 상태 변경으로 자동 전환
  };

  // 세션 복원 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-100 flex flex-col">
      <AdminHeader onLogout={logout} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/portfolio" replace />} />
          <Route path="/portfolio" element={<AdminPortfolioPage />} />
          <Route path="/stocks/*" element={<AdminStocksPage />} />
          <Route path="/issues" element={<AdminIssuesPage />} />
          <Route path="/resources" element={<AdminResourcesPage />} />
          <Route path="/glossary" element={<AdminGlossaryPage />} />
          <Route path="/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/settings" element={<AdminSettingsPage />} />
        </Routes>
      </main>
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
};

export default AdminApp;
