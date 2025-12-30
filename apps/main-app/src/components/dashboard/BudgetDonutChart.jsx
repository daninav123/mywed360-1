import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

const COLORS = ['#60A5FA', '#F9A8D4', '#FCD34D', '#6EE7B7', '#C4B5FD', '#FBBF24'];

export default function BudgetDonutChart({ budgetByCategory = [] }) {
  const { t, format } = useTranslations();

  const chartData = useMemo(() => {
    if (!Array.isArray(budgetByCategory) || budgetByCategory.length === 0) {
      return [
        { name: t('home2.budgetChart.venue', { defaultValue: 'Venue' }), value: 0 },
        { name: t('home2.budgetChart.catering', { defaultValue: 'Catering' }), value: 0 },
        { name: t('home2.budgetChart.flowers', { defaultValue: 'Flowers' }), value: 0 },
      ];
    }

    return budgetByCategory
      .filter(item => item.value > 0)
      .map(item => ({
        name: item.name || item.category || 'Other',
        value: Number(item.value) || 0,
      }));
  }, [budgetByCategory, t]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

    return (
      <div 
        className="p-3 rounded-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border-soft)',
        }}
      >
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{data.name}</p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {format.currency(data.value)} ({percentage}%)
        </p>
      </div>
    );
  };

  return (
    <div
      className="transition-all duration-200"
      style={{
        backgroundColor: 'transparent',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border-soft)',
        padding: '24px',
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}>
          {t('home2.budgetChart.title', { defaultValue: 'Budget Overview' })}
        </h3>
      </div>
      
      {total > 0 ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '4px',
              }}>
                {format.currency(total)}
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}>
                {t('home2.budgetChart.spent', { defaultValue: 'Spent' })} / {format.currency(total)} {t('home2.budgetChart.total', { defaultValue: 'Total' })}
              </p>
            </div>
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {chartData.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span style={{
                  fontFamily: "'DM Sans', 'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#718096',
                }} className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-yellow)' }}
          >
            <svg className="w-8 h-8" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p style={{
            fontSize: '16px',
            color: 'var(--color-text)',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            {t('home2.budgetChart.noDataTitle', { defaultValue: 'Aún no tienes presupuesto' })}
          </p>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginBottom: '16px',
          }}>
            {t('home2.budgetChart.noDataSubtitle', { defaultValue: 'Configura tu presupuesto para ver cómo se distribuyen tus gastos' })}
          </p>
          <button
            onClick={() => window.location.href = '/finanzas'}
            className="transition-all duration-200"
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {t('home2.budgetChart.createBudget', { defaultValue: 'Crear presupuesto' })}
          </button>
        </div>
      )}
    </div>
  );
}
