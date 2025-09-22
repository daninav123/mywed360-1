import React from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

export default function FinanceHeader({ syncStatus }) {
  const { t } = useTranslations();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--color-text)]">
          {t('finance.overview.title', { defaultValue: 'Gestión Financiera' })}
        </h1>
        <p className="text-[color:var(--color-text)]/70 mt-1">
          {t('finance.overview.subtitle', { defaultValue: 'Control completo del presupuesto y gastos de tu boda' })}
        </p>
        {syncStatus?.lastSyncTime && (
          <p className="text-xs text-[color:var(--color-text)]/50 mt-1">
            {t('finance.overview.lastSync', { defaultValue: 'Última sincronización' })}: {new Date(syncStatus.lastSyncTime).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {syncStatus?.isOnline ? (
          <div className="flex items-center text-[color:var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1 rounded-full">
            <Cloud size={16} className="mr-2" />
            <span className="text-sm font-medium">{t('finance.overview.synced', { defaultValue: 'Sincronizado' })}</span>
          </div>
        ) : (
          <div className="flex items-center text-[color:var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1 rounded-full">
            <CloudOff size={16} className="mr-2" />
            <span className="text-sm font-medium">{t('finance.overview.offline', { defaultValue: 'Sin conexión' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}




