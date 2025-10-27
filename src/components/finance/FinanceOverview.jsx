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
  if (!months || months === Infinity) return '∞';
  if (months < 0) return '0';
  return Math.round(months).toString();
};

const handleAccessibleClick = (event, callback) => {
  if (!callback) return;
  if (event.type === 'click') {
    callback();
  } else if (event.type === 'keydown' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    callback();
  }
};

export default function FinanceOverview({
  stats,
  budgetUsage = [],
  thresholds = { warn: 75, danger: 90 },
  onNavigate,
  isLoading = false,
  transactions = [],
  projection = null,
  predictiveInsights = null,
}) {
  const { t } = useTranslations();
  const safeBudget = Array.isArray(budgetUsage) ? budgetUsage : [];

  const warnThreshold = thresholds?.warn ?? 75;
  const dangerThreshold = thresholds?.danger ?? 90;

  const getBudgetStatusColor = (percentage) => {
    if (percentage >= dangerThreshold)
      return 'text-[color:var(--color-danger)] bg-[var(--color-danger)]/10';
    if (percentage >= warnThreshold)
      return 'text-[color:var(--color-warning)] bg-[var(--color-warning)]/10';
    return 'text-[color:var(--color-success)] bg-[var(--color-success)]/10';
  };

  const getBudgetIcon = (percentage) => {
    if (percentage >= dangerThreshold) return <AlertTriangle size={16} />;
    if (percentage >= warnThreshold) return <TrendingUp size={16} />;
    return <CheckCircle size={16} />;
  };

  const fallbackTotal = safeBudget.reduce((sum, category) => sum + toFinite(category.amount), 0);
  const expectedIncome = toFinite(stats?.expectedIncome);
  const totalBudget = toFinite(stats?.totalBudget);
  const totalSpent = toFinite(stats?.totalSpent);
  const effectiveTotal =
    expectedIncome > 0 ? expectedIncome : totalBudget > 0 ? totalBudget : fallbackTotal;
  const budgetPercent = effectiveTotal > 0 ? (totalSpent / effectiveTotal) * 100 : 0;

  const safeStats = {
    totalBudget,
    totalSpent,
    totalIncome: toFinite(stats?.totalIncome),
    currentBalance: toFinite(stats?.currentBalance),
    expectedIncome,
    budgetUsagePercentage: toFinite(stats?.budgetUsagePercentage),
  };

  const handleNavigate = (filters) => {
    if (typeof onNavigate === 'function') {
      onNavigate({ tab: 'transactions', filters });
    }
  };

  const clickableCardProps = (filters) => ({
    role: 'button',
    tabIndex: 0,
    className:
      'p-6 cursor-pointer transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40',
    onClick: () => handleNavigate(filters),
    onKeyDown: (event) => handleAccessibleClick(event, () => handleNavigate(filters)),
  });

  const alertCategories = safeBudget.filter(
    (cat) => !cat.muted && toFinite(cat.percentage) >= warnThreshold
  );

  // Build monthly series for sparklines and deltas (last 12 months)
  const monthly = React.useMemo(() => {
    const arr = Array.isArray(transactions) ? transactions : [];
    const months = [];
    const mapInc = new Map();
    const mapExp = new Map();
    const now = new Date();
    // prepare last 12 keys
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
      mapInc.set(key, 0);
      mapExp.set(key, 0);
    }
    for (const tx of arr) {
      if (!tx?.date) continue;
      const d = new Date(tx.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!mapInc.has(key)) continue; // outside 12m window
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') mapInc.set(key, mapInc.get(key) + Math.max(0, amount));
      else if (tx.type === 'expense') mapExp.set(key, mapExp.get(key) + Math.max(0, amount));
    }
    const income = months.map((k) => mapInc.get(k) || 0);
    const expense = months.map((k) => mapExp.get(k) || 0);
    const balance = income.map((v, i) => v - expense[i]);
    const computeDelta = (series) => {
      if (!series || series.length < 2) return { value: 0, trend: 'neutral' };
      const last = series[series.length - 1];
      const prev = series[series.length - 2];
      if (prev === 0) return { value: last === 0 ? 0 : 100, trend: last > 0 ? 'up' : 'neutral' };
      const pct = ((last - prev) / Math.abs(prev)) * 100;
      return { value: Math.abs(pct), trend: last > prev ? 'up' : last < prev ? 'down' : 'neutral' };
    };
    return {
      months,
      income,
      expense,
      balance,
      deltaIncome: computeDelta(income),
      deltaExpense: computeDelta(expense),
      deltaBalance: computeDelta(balance),
    };
  }, [transactions]);

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

      {/* Analítica Predictiva - Estilo dashboard premium */}
      {predictiveInsights && (
        <Card className="relative p-6 md:p-8 bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)]/95 to-[var(--color-surface)]/90 backdrop-blur-xl border-soft shadow-xl space-y-6 overflow-hidden">
          {/* Efecto de fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[var(--color-info)]/10 to-transparent rounded-full blur-3xl -z-0" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative z-10">
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
                    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                    : predictiveInsights.netTrend.direction === 'down'
                      ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                      : 'bg-[color:var(--color-text)]/10 text-[color:var(--color-text)]/70'
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 relative z-10">
            <div className="group p-5 rounded-xl bg-gradient-to-br from-[var(--color-danger)]/15 via-[var(--color-danger)]/5 to-transparent border border-[color:var(--color-danger)]/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
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
            <div className="group p-5 rounded-xl bg-gradient-to-br from-[var(--color-warning)]/15 via-[var(--color-warning)]/5 to-transparent border border-[color:var(--color-warning)]/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <p className="text-xs text-[color:var(--color-warning)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.monthsToZero', {
                  defaultValue: 'Meses hasta agotar presupuesto',
                })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-warning)] mb-1">
                {formatMonths(predictiveInsights.monthsToZero)}
              </p>
              {predictiveInsights.projectedZeroDate && (
                <p className="text-xs text-[color:var(--color-text)]/60">
                  {t('finance.overview.estimatedDate', { defaultValue: 'Estimado:' })}{' '}
                  {predictiveInsights.projectedZeroDate}
                </p>
              )}
            </div>
            <div className="group p-5 rounded-xl bg-gradient-to-br from-[var(--color-success)]/15 via-[var(--color-success)]/5 to-transparent border border-[color:var(--color-success)]/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
              <p className="text-xs text-[color:var(--color-success)] font-bold uppercase tracking-wider mb-2">
                {t('finance.overview.forecastSurplus', {
                  defaultValue: 'Saldo proyectado día de la boda',
                })}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[color:var(--color-success)] mb-1">
                {formatCurrency(predictiveInsights.forecastSurplus || 0)}
              </p>
            </div>
            <div className="group p-5 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/15 via-[var(--color-primary)]/5 to-transparent border border-[color:var(--color-primary)]/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
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
                      className="px-3 py-1 text-xs rounded-full bg-[var(--color-danger)]/10 text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/30"
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
                <ul className="space-y-2 text-xs text-[color:var(--color-text)]/80">
                  {predictiveInsights.upcomingPayments.map((payment, idx) => (
                    <li
                      key={`${payment.concept}-${idx}`}
                      className="flex items-center justify-between gap-2 border-b border-[color:var(--color-text)]/10 pb-1"
                    >
                      <div className="truncate">
                        <p className="font-medium truncate">{payment.concept}</p>
                        <p className="text-[color:var(--color-text)]/60">
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
      <Card className="p-6 md:p-7 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/95 backdrop-blur-xl border-soft shadow-lg">
        <h3 className="text-xl md:text-2xl font-bold text-body tracking-tight mb-5">
          {t('finance.overview.categoryStatus', {
            defaultValue: 'Estado del Presupuesto por Categor€)as',
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
                className="group flex items-center justify-between rounded-xl px-4 py-3 hover:bg-[var(--color-primary)]/5 transition-all duration-200 cursor-pointer"
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
                  <div className="w-full rounded-full h-2.5 bg-[color:var(--color-text)]/10 overflow-hidden shadow-inner">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        percentage >= 100
                          ? 'bg-gradient-to-r from-[var(--color-danger)] to-red-600 shadow-lg'
                          : percentage >= warnThreshold
                            ? 'bg-gradient-to-r from-[var(--color-warning)] to-orange-500 shadow-md'
                            : 'bg-gradient-to-r from-[var(--color-success)] to-emerald-500 shadow-md'
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
