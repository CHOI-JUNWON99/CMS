import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/shared/stores';
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
  const isSessionValid = useAdminAuthStore((state) => state.isSessionValid);
  const logout = useAdminAuthStore((state) => state.logout);
  const isAuthenticated = isSessionValid();

  // 세션 만료 체크 (1분마다)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      if (!isSessionValid()) {
        logout();
      }
    };

    const id = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated, isSessionValid, logout]);

  const handleAuthenticated = () => {
    window.location.reload();
  };

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
