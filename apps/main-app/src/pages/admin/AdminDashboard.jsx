import React from 'react';
import { useTranslation } from 'react-i18next';

import AdminDashboardView from '../../components/admin/AdminDashboard.jsx';

const AdminDashboard = () => {
  const { t } = useTranslation();
  
  return (
    <AdminDashboardView 
      searchPlaceholder={t('admin.dashboard.searchPlaceholder')} 
      filterPlaceholder={t('admin.dashboard.filterPlaceholder')} 
    />
  );
};

export default AdminDashboard;
