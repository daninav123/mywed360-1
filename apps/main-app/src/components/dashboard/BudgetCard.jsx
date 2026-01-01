import React from 'react';
import MetricCard from './MetricCard';
import useTranslations from '../../hooks/useTranslations';

export default function BudgetCard({ spent, total }) {
  const { t, format } = useTranslations();
  
  const spentAmount = Number(spent) || 0;
  const totalAmount = Number(total) || 0;
  const percentage = totalAmount > 0 ? Math.min((spentAmount / totalAmount) * 100, 100) : 0;

  return (
    <MetricCard
      title={t('home2.budget.title')}
      bgColor="#E8F5E9"
      textColor="#4A9B5F"
      valueColor="#4A9B5F"
      accentColor="#4A9B5F"
    >
      <p className="text-3xl font-bold" style={{ color: '#4A9B5F' }}>{format.currency(spentAmount)}</p>
      {totalAmount > 0 && (
        <>
          <p className="text-xs opacity-70 mt-1" style={{ color: '#718096' }}>
            {t('home2.budget.of')} {format.currency(totalAmount)}
          </p>
          <div className="mt-3 w-full rounded-full h-1" style={{ backgroundColor: 'rgba(74, 155, 95, 0.3)' }}>
            <div 
              className="h-1 rounded-full transition-all duration-300" 
              style={{ backgroundColor: '#4A9B5F', width: `${percentage}%` }}
            ></div>
          </div>
        </>
      )}
    </MetricCard>
  );
}
