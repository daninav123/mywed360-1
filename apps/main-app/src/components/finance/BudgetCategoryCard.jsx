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

  // Color azul uniforme del donut chart - simple y sencillo
  const bgColor = isDanger ? '#FFF0F0' : isWarning ? '#FFF9E6' : '#EFF6FF';
  const accentColor = isDanger ? '#E57373' : isWarning ? '#FFA726' : '#60A5FA';

  return (
    <div style={{
      backgroundColor: bgColor,
      borderRadius: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #EEF2F7',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Barra acento inferior - exacto como Home2 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: accentColor,
        opacity: 0.6,
      }} />

      {/* Header: Título + Botones */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '2px',
          }}>{category.name}</h3>
          {sourceTag && (
            <span style={{
              fontSize: '10px',
              color: '#9CA3AF',
              fontWeight: 500,
            }}>✨ AI</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(category, index)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#60A5FA'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
            aria-label={t('app.edit', { defaultValue: 'Editar' })}
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(index, category.name)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#E57373'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
            aria-label={t('app.delete', { defaultValue: 'Eliminar' })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Stats - Layout horizontal compacto */}
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <div>
          <p style={{
            fontSize: '10px',
            color: '#9CA3AF',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            marginBottom: '2px',
          }}>
            {t('finance.budget.assigned', { defaultValue: 'Presupuesto' })}
          </p>
          <p style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1F2937',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>{formatCurrency(assignedAmount)}</p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: '10px',
            color: isDanger ? '#E57373' : '#9CA3AF',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            marginBottom: '2px',
          }}>
            {t('finance.budget.spent', { defaultValue: 'Gastado' })}
          </p>
          <p style={{
            fontSize: '20px',
            fontWeight: 600,
            color: isDanger ? '#E57373' : '#1F2937',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {formatCurrency(spent)}
          </p>
        </div>
      </div>

      {/* Info secundaria - más compacta */}
      <div style={{
        fontSize: '11px',
        color: '#9CA3AF',
        lineHeight: 1.4,
      }}>
        {remaining !== 0 && (
          <span style={{ 
            color: remaining < 0 ? '#E57373' : accentColor, 
            fontWeight: 600,
            fontSize: '12px',
          }}>
            {remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))} {remaining < 0 ? 'sobre presupuesto' : 'disponible'}
          </span>
        )}
        {committed > 0 && remaining !== 0 && <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>}
        {committed > 0 && (
          <span style={{ color: isCommittedOverBudget ? '#E57373' : '#9CA3AF' }}>
            {formatCurrency(committed)} comprometido
          </span>
        )}
      </div>
    </div>
  );
}
