import React from 'react';

import useTranslations from '../../hooks/useTranslations';

export default function FinanceHeader() {
  const { t } = useTranslations();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--color-text)]">
          {t('finance.overview.title', { defaultValue: 'Gestión Financiera' })}
        </h1>
        <p className="text-[color:var(--color-text-70)] mt-1">
          {t('finance.overview.subtitle', {
            defaultValue: 'Control completo del presupuesto y gastos de tu boda',
          })}
        </p>
      </div>
    </div>
  );
}