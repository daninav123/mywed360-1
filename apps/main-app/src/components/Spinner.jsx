import React from 'react';
import useTranslations from '../hooks/useTranslations';

export default function Spinner() {
  const { t } = useTranslations();
  
  return (
    <div className="flex items-center justify-center p-4" role="status" aria-label={t('app.loading')}>
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
