import { Edit3, Trash2, AlertTriangle, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';

import { Card } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Card premium individual para cada categoría de presupuesto
 */
export default function BudgetCategoryCard({
  category,
  index,
  assignedAmount,
  committedAmount,
  spentAmount,
  usagePercent,
  thresholds,
  onEdit,
  onDelete,
  t,
}) {
  const committed = Number(committedAmount) || 0;
  const spent = Number(spentAmount) || 0;
  const committedPercent =
    assignedAmount > 0
      ? (committed / assignedAmount) * 100
      : committed > 0
        ? 999
        : 0;
  const riskPercent = Math.max(Number(usagePercent) || 0, committedPercent);
  const progressPercent = Math.min(riskPercent, 100);
  const usedOrCommitted = Math.max(spent, committed);
  const remaining = assignedAmount - usedOrCommitted;
  const isSpentOverBudget = spent > assignedAmount;
  const isCommittedOverBudget = committedPercent >= 100;
  const isDanger = riskPercent >= (thresholds.danger || 90);
  const isWarning = riskPercent >= (thresholds.warn || 75) && !isDanger;

  // Colores dinámicos
  const borderColor = isDanger
    ? 'border-[color:var(--color-danger-40)]'
    : isWarning
      ? 'border-[color:var(--color-warning-40)]'
      : 'border-[color:var(--color-border)]';

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
    <Card className={`relative p-0 overflow-hidden transition-shadow duration-300 hover:shadow-lg ${borderColor}`}>
      {/* Header */}
      <div className="p-4 border-b border-soft">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-body mb-1">{category.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {sourceTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-15)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-primary)]">
                  <Sparkles size={12} />
                  {t('finance.budget.advisor', { defaultValue: 'AI' })}
                </span>
              )}
              {isSpentOverBudget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger-15)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-danger)]">
                  <AlertTriangle size={12} />
                  {t('finance.budget.exceeded', { defaultValue: 'Excedido' })}
                </span>
              )}
              {!isSpentOverBudget && isCommittedOverBudget && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-15)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--color-warning)]">
                  <AlertTriangle size={12} />
                  {t('finance.budget.committed', { defaultValue: 'Comprometido' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(category, index)}
              className="p-2 rounded-lg text-[color:var(--color-primary)] hover:bg-[var(--color-primary-10)] transition-colors duration-150"
              aria-label={t('app.edit', { defaultValue: 'Editar' })}
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(index, category.name)}
              className="p-2 rounded-lg text-[color:var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors duration-150"
              aria-label={t('app.delete', { defaultValue: 'Eliminar' })}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-[color:var(--color-text-10)] overflow-hidden">
            <div
              className={`${barColor} h-full rounded-full transition-all duration-500 ease-out relative`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${textColor}`}>{riskPercent.toFixed(1)}%</span>
            <span className="text-[color:var(--color-text-60)]">
              {t('finance.budget.used', { defaultValue: 'Usado/Comprometido' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-4 divide-x divide-[color:var(--color-border)]">
        <div className="text-center px-2">
          <p className="text-xs text-[color:var(--color-text-60)] mb-1">
            {t('finance.budget.assigned', { defaultValue: 'Asignado' })}
          </p>
          <p className="text-sm font-black text-body">{formatCurrency(assignedAmount)}</p>
        </div>
        <div className="text-center px-2">
          <p className="text-xs text-[color:var(--color-text-60)] mb-1">
            {t('finance.budget.committedAmount', { defaultValue: 'Comprom.' })}
          </p>
          <p
            className={`text-sm font-black ${
              isCommittedOverBudget ? 'text-[color:var(--color-danger)]' : 'text-body'
            }`}
          >
            {formatCurrency(committed)}
          </p>
        </div>
        <div className="text-center px-2">
          <p className="text-xs text-[color:var(--color-text-60)] mb-1">
            {t('finance.budget.spent', { defaultValue: 'Gastado' })}
          </p>
          <p
            className={`text-sm font-black ${isDanger ? 'text-[color:var(--color-danger)]' : 'text-body'}`}
          >
            {formatCurrency(spent)}
          </p>
        </div>
        <div className="text-center px-2">
          <p className="text-xs text-[color:var(--color-text-60)] mb-1">
            {t('finance.budget.remaining', { defaultValue: 'Restante' })}
          </p>
          <p className={`text-sm font-black ${textColor}`}>
            {remaining < 0 ? (
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
    </Card>
  );
}
