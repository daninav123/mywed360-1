import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

const toFinite = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function FinanceHeroSection({ 
  stats, 
  budgetUsage = [], 
  thresholds = { warn: 75, danger: 90 },
  isLoading = false,
  onNavigate 
}) {
  const { t } = useTranslations();
  
  const currentBalance = toFinite(stats?.currentBalance);
  const totalBudget = toFinite(stats?.totalBudget);
  const totalSpent = toFinite(stats?.totalSpent);
  const expectedIncome = toFinite(stats?.expectedIncome);
  
  const effectiveTotal = expectedIncome > 0 ? expectedIncome : totalBudget;
  const budgetPercent = effectiveTotal > 0 ? (totalSpent / effectiveTotal) * 100 : 0;
  
  const isHealthy = currentBalance >= 0;
  const isAtRisk = budgetPercent >= thresholds.danger;
  const isWarning = budgetPercent >= thresholds.warn && !isAtRisk;
  
  const alertCategories = budgetUsage.filter(
    (cat) => !cat.muted && toFinite(cat.percentage) >= thresholds.warn
  ).slice(0, 3); // Solo top 3

  const getHealthColor = () => {
    if (isAtRisk) return 'danger';
    if (isWarning) return 'warning';
    return 'success';
  };

  const healthColor = getHealthColor();
  const colorMap = {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* HERO CARD - Balance Actual */}
      <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/95 backdrop-blur-xl border-2 shadow-2xl p-6 md:p-8">
        {/* Fondo decorativo dinámico */}
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-500"
          style={{ backgroundColor: colorMap[healthColor] }}
        />
        <div 
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-15 transition-all duration-500"
          style={{ backgroundColor: colorMap[healthColor] }}
        />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted mb-1">
                {t('finance.overview.currentBalance', { defaultValue: 'Balance Actual' })}
              </p>
              {isLoading ? (
                <div className="h-16 md:h-20 w-64 bg-[color:var(--color-text)]/10 rounded-xl animate-pulse" />
              ) : (
                <h1 
                  className="text-5xl md:text-7xl font-black tracking-tight transition-colors duration-300"
                  style={{ color: colorMap[healthColor] }}
                >
                  {formatCurrency(currentBalance)}
                </h1>
              )}
            </div>
            <div 
              className="p-4 md:p-5 rounded-2xl shadow-xl transition-all duration-300 hover:scale-110"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${colorMap[healthColor]} 15%, var(--color-surface))`,
                boxShadow: `0 8px 24px color-mix(in srgb, ${colorMap[healthColor]} 30%, transparent)`
              }}
            >
              {isHealthy ? (
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10" style={{ color: colorMap[healthColor] }} />
              ) : (
                <TrendingDown className="w-8 h-8 md:w-10 md:h-10" style={{ color: colorMap[healthColor] }} />
              )}
            </div>
          </div>

          {/* Status Bar */}
          {!isLoading && (
            <div className="flex items-center gap-3 flex-wrap">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shadow-lg"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${colorMap[healthColor]} 20%, transparent)`,
                  color: colorMap[healthColor]
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colorMap[healthColor] }} />
                {isAtRisk 
                  ? t('finance.hero.statusCritical', { defaultValue: 'Crítico' })
                  : isWarning 
                    ? t('finance.hero.statusWarning', { defaultValue: 'Atención' })
                    : t('finance.hero.statusHealthy', { defaultValue: 'Saludable' })
                }
              </div>
              <div className="text-sm text-muted font-semibold">
                {budgetPercent.toFixed(1)}% {t('finance.overview.ofBudget', { defaultValue: 'del presupuesto' })}
              </div>
            </div>
          )}

          {/* Alertas Críticas Integradas */}
          {!isLoading && alertCategories.length > 0 && (
            <div className="pt-4 border-t border-soft">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[color:var(--color-warning)]" />
                <h4 className="text-sm font-bold text-body">
                  {t('finance.hero.criticalAlerts', { defaultValue: 'Alertas Críticas' })}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate?.({ categoryFilter: cat.name, typeFilter: 'expense' })}
                    className="group px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/10 border border-[color:var(--color-warning)]/30 hover:bg-[var(--color-warning)]/20 transition-all duration-200"
                  >
                    <span className="text-xs font-semibold text-[color:var(--color-warning)]">
                      {cat.name}
                    </span>
                    <span className="text-xs text-muted ml-1">
                      {toFinite(cat.percentage).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats Sidebar */}
      <Card className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/90 backdrop-blur-xl border-soft shadow-xl p-6">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {t('finance.overview.totalBudget', { defaultValue: 'Presupuesto' })}
            </p>
            {isLoading ? (
              <div className="h-8 w-32 bg-[color:var(--color-text)]/10 rounded animate-pulse" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-primary)]">
                {formatCurrency(effectiveTotal)}
              </p>
            )}
          </div>

          <div className="h-px bg-soft" />

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {t('finance.overview.totalSpent', { defaultValue: 'Gastado' })}
            </p>
            {isLoading ? (
              <div className="h-8 w-32 bg-[color:var(--color-text)]/10 rounded animate-pulse" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-danger)]">
                {formatCurrency(totalSpent)}
              </p>
            )}
          </div>

          <div className="h-px bg-soft" />

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {t('finance.overview.expectedIncome', { defaultValue: 'Ingresos' })}
            </p>
            {isLoading ? (
              <div className="h-8 w-32 bg-[color:var(--color-text)]/10 rounded animate-pulse" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-success)]">
                {formatCurrency(expectedIncome)}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
