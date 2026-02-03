import React, { useCallback, useState } from 'react';
import AdminResourcesView from '../AdminResourcesView';

const AdminResourcesPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return <AdminResourcesView key={refreshKey} onRefresh={refreshData} />;
};

export default AdminResourcesPage;
