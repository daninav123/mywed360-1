import React from 'react';

import { Dashboard as DashboardComponent } from '../components/dashboard/Dashboard';
import MainLayout from '../components/MainLayout';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <DashboardComponent />
      </div>
    </MainLayout>
  );
}
