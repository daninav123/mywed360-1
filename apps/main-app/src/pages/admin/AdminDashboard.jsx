import React from 'react';
import { t } from '../../i18n'; // Assuming you have an i18n module

import AdminDashboardView from '../../components/admin/AdminDashboard.jsx';

const AdminDashboard = () => (
  <AdminDashboardView 
    searchPlaceholder={t('admin.dashboard.searchPlaceholder')} 
    filterPlaceholder={t('admin.dashboard.filterPlaceholder')} 
  />
);

export default AdminDashboard;
