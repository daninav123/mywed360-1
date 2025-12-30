import React, { useMemo } from 'react';
import MetricCard from './MetricCard';
import useTranslations from '../../hooks/useTranslations';

const parseDateLike = (input) => {
  if (!input) return null;
  try {
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input;
    }
    if (typeof input?.toDate === 'function') {
      const d = input.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'object' && typeof input.seconds === 'number') {
      const d = new Date(input.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'number') {
      const d = new Date(input);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  } catch {
    return null;
  }
  return null;
};

export default function CountdownCard({ weddingDate }) {
  const { t } = useTranslations();
  
  const countdown = useMemo(() => {
    const eventDate = parseDateLike(weddingDate);
    if (!eventDate) return null;
    
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays > 0 ? diffDays : 0,
      isPast: diffDays < 0,
    };
  }, [weddingDate]);

  if (!countdown) {
    return (
      <MetricCard
        title={t('home2.countdown.title', { defaultValue: 'Countdown' })}
        bgColor="#FFF4E6"
        textColor="#D4A574"
        valueColor="#D4A574"
        accentColor="#D4A574"
      >
        <p className="text-2xl font-bold" style={{ color: '#D4A574' }}>---</p>
        <p className="text-xs opacity-70 mt-1" style={{ color: '#D4A574' }}>
          {t('home2.countdown.noDate', { defaultValue: 'Set your wedding date' })}
        </p>
      </MetricCard>
    );
  }

  return (
    <MetricCard
      title={t('home2.countdown.title', { defaultValue: 'Countdown' })}
      bgColor="#FFF4E6"
      textColor="#D4A574"
      valueColor="#D4A574"
      accentColor="#D4A574"
    >
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-bold" style={{ color: '#D4A574' }}>{countdown.days}</p>
        <p className="text-sm opacity-70" style={{ color: '#718096' }}>
          {countdown.isPast
            ? t('home2.countdown.past', { defaultValue: 'Wedding day passed!' })
            : t('home2.countdown.daysToGo', { defaultValue: 'Days to Go' })
          }
        </p>
      </div>
      <div className="mt-3 w-full rounded-full h-1" style={{ backgroundColor: 'rgba(212, 165, 116, 0.3)' }}>
        <div className="h-1 rounded-full" style={{ backgroundColor: '#D4A574', width: '60%' }}></div>
      </div>
    </MetricCard>
  );
}
