import React from 'react';
import { Card } from './index';

/**
 * Tarjeta KPI compacta para mostrar métricas clave
 */
export default function KPICard({ label, value, icon, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-[var(--color-primary-10)] border-[color:var(--color-primary-30)] text-[color:var(--color-primary)]',
    success: 'bg-[var(--color-success-10)] border-[color:var(--color-success-30)] text-[color:var(--color-success)]',
    warning: 'bg-[var(--color-warning-10)] border-[color:var(--color-warning-30)] text-[color:var(--color-warning)]',
    danger: 'bg-[var(--color-danger-10)] border-[color:var(--color-danger-30)] text-[color:var(--color-danger)]',
    info: 'bg-[var(--color-info-10)] border-[color:var(--color-info-30)] text-[color:var(--color-info)]',
  };

  return (
    <Card className={`p-4 ${colorClasses[color] || colorClasses.primary}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <div className="text-xs mt-1 opacity-70">{trend}</div>
      )}
    </Card>
  );
}
