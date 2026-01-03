import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';

import { Card } from '../ui';
import FinanceHeroSection from './FinanceHeroSection';
import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';

const toFinite = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatMonths = (months) => {
  if (months == null || !Number.isFinite(months)) return 'N/A';
  if (months === Infinity) return '∞';
  return months.toFixed(1);
};

const handleAccessibleClick = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};

export default function FinanceOverview({
  stats,
  budgetUsage = [],
  thresholds = { warn: 75, danger: 90 },
  onNavigate,
  isLoading = false,
  predictiveInsights = null,
}) {
  const { t } = useTranslations();
  const safeBudget = Array.isArray(budgetUsage) ? budgetUsage : [];

  const warnThreshold = thresholds?.warn ?? 75;
  const dangerThreshold = thresholds?.danger ?? 90;

  const getBudgetStatusColor = (percentage) => {
    if (percentage >= dangerThreshold)
      return 'text-[color:var(--color-danger)] bg-[var(--color-danger-10)]';
    if (percentage >= warnThreshold)
      return 'text-[color:var(--color-warning)] bg-[var(--color-warning-10)]';
    return 'text-[color:var(--color-success)] bg-[var(--color-success-10)]';
  };

  const getBudgetIcon = (percentage) => {
    if (percentage >= dangerThreshold) return <AlertTriangle size={16} />;
    if (percentage >= warnThreshold) return <TrendingUp size={16} />;
    return <CheckCircle size={16} />;
  };

  const safeStats = {
    totalBudget: toFinite(stats?.totalBudget),
    totalSpent: toFinite(stats?.totalSpent),
    totalIncome: toFinite(stats?.totalIncome),
    currentBalance: toFinite(stats?.currentBalance),
    expectedIncome: toFinite(stats?.expectedIncome),
    budgetUsagePercentage: toFinite(stats?.budgetUsagePercentage),
  };

  const handleNavigate = (filters) => {
    if (typeof onNavigate === 'function') {
      onNavigate({ tab: 'transactions', filters });
    }
  };

  return (
    <div className="space-y-6">
      {/* 🔴 HERO SECTION - Critical Status */}
      <FinanceHeroSection
        stats={safeStats}
        budgetUsage={safeBudget}
        thresholds={thresholds}
        isLoading={isLoading}
        onNavigate={handleNavigate}
      />

      {/* Analítica Predictiva */}
      {predictiveInsights && (
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-body tracking-tight">
                {t('finance.overview.predictiveTitle', { defaultValue: 'Analítica predictiva' })}
              </h3>
              <p className="text-sm text-muted mt-1">
                {t('finance.overview.predictiveSubtitle', {
                  defaultValue: 'Basado en la media móvil de los últimos seis meses.',
                })}
              </p>
            </div>
            {predictiveInsights.netTrend && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  predictiveInsights.netTrend.direction === 'up'
                    ? 'bg-[var(--color-success-15)] text-[color:var(--color-success)]'
                    : predictiveInsights.netTrend.direction === 'down'
                      ? 'bg-[var(--color-danger-15)] text-[color:var(--color-danger)]'
                      : 'bg-[color:var(--color-text-10)] text-[color:var(--color-text-70)]'
                }`}
              >
                {predictiveInsights.netTrend.direction === 'up'
                  ? t('finance.overview.trendUp', { defaultValue: 'Tendencia positiva' })
                  : predictiveInsights.netTrend.direction === 'down'
                    ? t('finance.overview.trendDown', { defaultValue: 'Tendencia negativa' })
                    : t('finance.overview.trendFlat', { defaultValue: 'Tendencia estable' })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
            <div className="p-5 rounded-xl bg-[var(--color-danger-10)] border border-[color:var(--color-danger-30)]">
              <p className="text-xs text-[color:var(--color-danger)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.burnRate', { defaultValue: 'Burn rate mensual' })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-danger)] mb-1">
                {formatCurrency(predictiveInsights.burnRate || 0)}
              </p>
              <p className="text-xs text-muted font-medium">
                {t('finance.overview.avgExpense', {
                  defaultValue: 'Gasto neto promedio mensual',
                })}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[var(--color-warning-10)] border border-[color:var(--color-warning-30)]">
              <p className="text-xs text-[color:var(--color-warning)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.monthsToZero', {
                  defaultValue: 'Meses hasta agotar presupuesto',
                })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-warning)] mb-1">
                {formatMonths(predictiveInsights.monthsToZero)}
              </p>
              {predictiveInsights.projectedZeroDate && (
                <p className="text-xs text-[color:var(--color-text-60)]">
                  {t('finance.overview.estimatedDate', { defaultValue: 'Estimado:' })}{' '}
                  {predictiveInsights.projectedZeroDate}
                </p>
              )}
            </div>
            <div className="p-5 rounded-xl bg-[var(--color-success-10)] border border-[color:var(--color-success-30)]">
              <p className="text-xs text-[color:var(--color-success)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.forecastSurplus', {
                  defaultValue: 'Saldo proyectado día de la boda',
                })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-success)] mb-1">
                {formatCurrency(predictiveInsights.forecastSurplus || 0)}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[var(--color-primary-10)] border border-[color:var(--color-primary-30)]">
              <p className="text-xs text-[color:var(--color-primary)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.recommendedSaving', {
                  defaultValue: 'Ahorro mensual recomendado',
                })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-primary)] mb-1">
                {formatCurrency(predictiveInsights.recommendedMonthlySaving || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {predictiveInsights.categoriesAtRisk?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--color-text)] mb-2">
                  {t('finance.overview.categoriesAtRisk', {
                    defaultValue: 'Categorías en riesgo',
                  })}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {predictiveInsights.categoriesAtRisk.map((cat) => (
                    <span
                      key={cat.name}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--color-danger-10)] text-[color:var(--color-danger)] border border-[color:var(--color-danger-30)]"
                    >
                      {cat.name} · {cat.percentage?.toFixed(1)}% ·{' '}
                      {formatCurrency(cat.remaining || 0)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {predictiveInsights.upcomingPayments?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--color-text)] mb-2">
                  {t('finance.overview.upcomingPayments', {
                    defaultValue: 'Pagos próximos',
                  })}
                </h4>
                <ul className="space-y-2 text-xs text-[color:var(--color-text-80)]">
                  {predictiveInsights.upcomingPayments.map((payment, idx) => (
                    <li
                      key={`${payment.concept}-${idx}`}
                      className="flex items-center justify-between gap-2 border-b border-[color:var(--color-text-10)] pb-1"
                    >
                      <div className="truncate">
                        <p className="font-medium truncate">{payment.concept}</p>
                        <p className="text-[color:var(--color-text-60)]">
                          {payment.dueDate} ·{' '}
                          {payment.provider ||
                            t('finance.overview.noProvider', {
                              defaultValue: 'Proveedor sin asignar',
                            })}
                        </p>
                      </div>
                      <span className="whitespace-nowrap font-semibold">
                        {formatCurrency(payment.outstanding)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 💰 PRESUPUESTO POR CATEGORÍAS - Vista compacta */}
      <Card className="p-6 md:p-7">
        <h3 className="text-xl md:text-2xl font-bold text-body tracking-tight mb-5">
          {t('finance.overview.categoryStatus', {
            defaultValue: 'Estado del Presupuesto por Categorías',
          })}
        </h3>
        <div className="space-y-4">
          {safeBudget.map((category, index) => {
            const percentage = toFinite(category.percentage);
            const action = () =>
              handleNavigate({ categoryFilter: category.name, typeFilter: 'expense' });
            return (
              <div
                key={index}
                className="group flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[var(--color-primary-5)] transition-all duration-200 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={action}
                onKeyDown={(event) => handleAccessibleClick(event, action)}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-body group-hover:text-[color:var(--color-primary)] transition-colors duration-200">
                      {category.name}
                    </span>
                    <span className="text-sm text-muted font-medium">
                      {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2.5 bg-[color:var(--color-text-10)] overflow-hidden shadow-inner">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        percentage >= 100
                          ? 'bg-[var(--color-danger)]'
                          : percentage >= warnThreshold
                            ? 'bg-[var(--color-warning)]'
                            : 'bg-[var(--color-success)]'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`ml-3 px-3 py-2 rounded-xl text-xs font-bold shadow-md ${getBudgetStatusColor(percentage)}`}
                >
                  <div className="flex items-center space-x-1.5">
                    {getBudgetIcon(percentage)}
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}
