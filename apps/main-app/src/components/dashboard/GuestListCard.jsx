import React from 'react';
import MetricCard from './MetricCard';
import useTranslations from '../../hooks/useTranslations';

export default function GuestListCard({ confirmed, pending }) {
  const { t } = useTranslations();
  
  const confirmedCount = Number(confirmed) || 0;
  const pendingCount = Number(pending) || 0;
  const total = confirmedCount + pendingCount;
  
  return (
    <MetricCard
      title={t('home2.guestList.title')}
      bgColor="#FCE4EC"
      textColor="#C97C8F"
      valueColor="#C97C8F"
      accentColor="#C97C8F"
    >
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-bold" style={{ color: '#C97C8F' }}>{confirmedCount}</p>
        <p className="text-sm opacity-70" style={{ color: '#718096' }}>
          {t('home2.guestList.confirmed')}
        </p>
      </div>
      <p className="text-xs opacity-70 mt-1" style={{ color: '#718096' }}>
        {pendingCount} {t('home2.guestList.pending')}
      </p>
    </MetricCard>
  );
}
