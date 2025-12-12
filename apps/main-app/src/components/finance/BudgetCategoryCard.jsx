import { Edit3, Trash2, AlertTriangle, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';

import { formatCurrency } from '../../utils/formatUtils';

/**
 * Card premium individual para cada categoría de presupuesto
 */
export default function BudgetCategoryCard({
  category,
  index,
  assignedAmount,
  spentAmount,
  usagePercent,
  thresholds,
  onEdit,
  onDelete,
  t,
}) {
  const progressPercent = Math.min(usagePercent, 100);
  const remaining = Math.max(0, assignedAmount - spentAmount);
  const isOverBudget = usagePercent >= 100;
  const isDanger = usagePercent >= (thresholds.danger || 90);
  const isWarning = usagePercent >= (thresholds.warn || 75) && !isDanger;
  const isSuccess = !isWarning && !isDanger;

  // Colores dinámicos
  const borderColor = isDanger
    ? 'border-[var(--color-danger)]/40'
    : isWarning
      ? 'border-[var(--color-warning)]/40'
      : 'border-[var(--color-success)]/30';

  const bgColor = isDanger
    ? 'bg-[var(--color-danger)]/10'
    : isWarning
      ? 'bg-[var(--color-warning)]/10'
      : 'bg-[var(--color-success)]/10';

  const barColor = isDanger
    ? 'bg-[var(--color-danger)]'
    : isWarning
      ? 'bg-[var(--color-warning)]'
      : 'bg-[var(--color-success)]';

  const textColor = isDanger
    ? 'text-[color:var(--color-danger)]'
    : isWarning
      ? 'text-[color:var(--color-warning)]'
      : 'text-[color:var(--color-success)]';

  const sourceTag = category.source?.toLowerCase() === 'advisor';

  return (
    <div
      className={`relative rounded-xl border-2 ${borderColor} ${bgColor} bg-[var(--color-surface)] shadow-md transition-all duration-300 hover:shadow-lg`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--color-text)]/10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-body mb-1">{category.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {sourceTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  <Sparkles size={12} />
                  {t('finance.budget.advisor', { defaultValue: 'AI' })}
                </span>
              )}
              {isOverBudget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/15 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-danger)]">
                  <AlertTriangle size={12} />
                  {t('finance.budget.exceeded', { defaultValue: 'Excedido' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(category, index)}
              className="p-2 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
              aria-label={t('app.edit', { defaultValue: 'Editar' })}
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(index, category.name)}
              className="p-2 rounded-lg text-[color:var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors duration-150"
              aria-label={t('app.delete', { defaultValue: 'Eliminar' })}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-[color:var(--color-text)]/10 overflow-hidden">
            <div
              className={`${barColor} h-full rounded-full transition-all duration-500 ease-out relative`}
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-[var(--color-primary)]/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${textColor}`}>{usagePercent.toFixed(1)}%</span>
            <span className="text-[color:var(--color-text)]/60">
              {t('finance.budget.used', { defaultValue: 'Usado' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-[color:var(--color-text)]/60 mb-1">
            {t('finance.budget.assigned', { defaultValue: 'Asignado' })}
          </p>
          <p className="text-sm font-black text-body">{formatCurrency(assignedAmount)}</p>
        </div>
        <div className="text-center border-l border-r border-[color:var(--color-text)]/10">
          <p className="text-xs text-[color:var(--color-text)]/60 mb-1">
            {t('finance.budget.spent', { defaultValue: 'Gastado' })}
          </p>
          <p className={`text-sm font-black ${isDanger ? 'text-[color:var(--color-danger)]' : 'text-body'}`}>
            {formatCurrency(spentAmount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[color:var(--color-text)]/60 mb-1">
            {t('finance.budget.remaining', { defaultValue: 'Restante' })}
          </p>
          <p className={`text-sm font-black ${textColor}`}>
            {isOverBudget ? (
              <span className="inline-flex items-center gap-1">
                <TrendingDown size={14} />
                -{formatCurrency(Math.abs(remaining))}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <TrendingUp size={14} />
                {formatCurrency(remaining)}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
