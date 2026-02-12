import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminGate from './AdminGate';
import AdminHeader from './components/AdminHeader';
import AdminPortfolioPage from './pages/AdminPortfolioPage';
import AdminStocksPage from './pages/AdminStocksPage';
import AdminIssuesPage from './pages/AdminIssuesPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import AdminGlossaryPage from './pages/AdminGlossaryPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

function isAdminSessionValid(): boolean {
  const auth = localStorage.getItem('cms_admin_authenticated');
  const expiresAt = localStorage.getItem('cms_admin_expires_at');
  if (auth !== 'true' || !expiresAt) return false;
  return Date.now() < Number(expiresAt);
}

function clearAdminSession() {
  localStorage.removeItem('cms_admin_authenticated');
  localStorage.removeItem('cms_admin_expires_at');
  localStorage.removeItem('cms_admin_code');
}

const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminSessionValid);

  const logout = useCallback(() => {
    clearAdminSession();
    setIsAuthenticated(false);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
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
    </div>
  );
};

export default AdminApp;
