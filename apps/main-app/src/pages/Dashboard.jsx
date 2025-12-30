import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dashboard as DashboardComponent } from '../components/dashboard/Dashboard';
import MainLayout from '../components/MainLayout';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <DashboardComponent placeholder={t('dashboard.searchPlaceholder')} />
      </div>
    </MainLayout>
  );
}
