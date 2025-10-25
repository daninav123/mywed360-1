import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';

import { Card } from '../ui';
import StatCard from './StatCard';
import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';

const toFinite = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          {...clickableCardProps({ typeFilter: 'expense' })}
          aria-label={t('finance.overview.totalBudget', { defaultValue: 'Presupuesto Total' })}
          title={t('finance.overview.totalBudget', { defaultValue: 'Presupuesto Total' })}
          value={formatCurrency(effectiveTotal)}
          icon={<TrendingUp className="w-5 h-5" />}
          tone="primary"
          loading={isLoading}
          tooltip={t('finance.overview.totalBudget', { defaultValue: 'Presupuesto Total' })}
          sparklineData={monthly.expense}
        />

        <StatCard
          {...clickableCardProps({ typeFilter: 'expense' })}
          aria-label={t('finance.overview.totalSpent', { defaultValue: 'Total Gastado' })}
          title={t('finance.overview.totalSpent', { defaultValue: 'Total Gastado' })}
          value={
            <span className="text-[color:var(--color-danger)]">
              {formatCurrency(safeStats.totalSpent)}
            </span>
          }
          subtitle={`${budgetPercent.toFixed(1)}% ${t('finance.overview.ofBudget', { defaultValue: 'del presupuesto' })}`}
          icon={<TrendingDown className="w-5 h-5" />}
          tone="danger"
          loading={isLoading}
          tooltip={t('finance.overview.totalSpent', { defaultValue: 'Total Gastado' })}
          deltaValue={monthly.deltaExpense.value}
          deltaTrend={monthly.deltaExpense.trend}
          deltaLabel={t('finance.overview.vsPrevMonth', { defaultValue: 'vs. mes anterior' })}
          sparklineData={monthly.expense}
        />

        <StatCard
          aria-label={t('finance.overview.currentBalance', { defaultValue: 'Balance Actual' })}
          title={t('finance.overview.currentBalance', { defaultValue: 'Balance Actual' })}
          value={
            <span
              className={
                safeStats.currentBalance >= 0
                  ? 'text-[color:var(--color-success)]'
                  : 'text-[color:var(--color-danger)]'
              }
            >
              {formatCurrency(safeStats.currentBalance)}
            </span>
          }
          icon={
            safeStats.currentBalance >= 0 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )
          }
          tone={safeStats.currentBalance >= 0 ? 'success' : 'danger'}
          loading={isLoading}
          tooltip={t('finance.overview.currentBalance', { defaultValue: 'Balance Actual' })}
          deltaValue={monthly.deltaBalance.value}
          deltaTrend={monthly.deltaBalance.trend}
          deltaLabel={t('finance.overview.vsPrevMonth', { defaultValue: 'vs. mes anterior' })}
          sparklineData={monthly.balance}
        />

        <StatCard
          {...clickableCardProps({ typeFilter: 'income' })}
          aria-label={t('finance.overview.expectedIncome', { defaultValue: 'Ingresos Esperados' })}
          title={t('finance.overview.expectedIncome', { defaultValue: 'Ingresos Esperados' })}
          value={
            <span className="text-[color:var(--color-success)]">
              {formatCurrency(safeStats.expectedIncome)}
            </span>
          }
          icon={<TrendingUp className="w-5 h-5" />}
          tone="success"
          loading={isLoading}
          tooltip={t('finance.overview.expectedIncome', { defaultValue: 'Ingresos Esperados' })}
          deltaValue={monthly.deltaIncome.value}
          deltaTrend={monthly.deltaIncome.trend}
          deltaLabel={t('finance.overview.vsPrevMonth', { defaultValue: 'vs. mes anterior' })}
          sparklineData={monthly.income}
        />
      </div>

      {predictiveInsights && (
        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
                {t('finance.overview.predictiveTitle', { defaultValue: 'Analítica predictiva' })}
              </h3>
              <p className="text-sm text-[color:var(--color-text)]/60">
                {t('finance.overview.predictiveSubtitle', {
                  defaultValue: {t('common.basado_media_movil_los_ultimos')},
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30">
              <p className="text-xs text-[color:var(--color-danger)]/80 uppercase tracking-wide">
                {t('finance.overview.burnRate', { defaultValue: 'Burn rate mensual' })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-danger)]">
                {formatCurrency(predictiveInsights.burnRate || 0)}
              </p>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.overview.avgExpense', {
                  defaultValue: 'Ingreso neto promedio mensual',
                })}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-warning)]/10 border border-[color:var(--color-warning)]/30">
              <p className="text-xs text-[color:var(--color-warning)]/80 uppercase tracking-wide">
                {t('finance.overview.monthsToZero', {
                  defaultValue: 'Meses hasta agotar presupuesto',
                })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-warning)]">
                {formatMonths(predictiveInsights.monthsToZero)}
              </p>
              {predictiveInsights.projectedZeroDate && (
                <p className="text-xs text-[color:var(--color-text)]/60">
                  {t('finance.overview.estimatedDate', { defaultValue: 'Estimado:' })}{' '}
                  {predictiveInsights.projectedZeroDate}
                </p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-success)]/10 border border-[color:var(--color-success)]/30">
              <p className="text-xs text-[color:var(--color-success)]/80 uppercase tracking-wide">
                {t('finance.overview.forecastSurplus', {
                  defaultValue: {t('common.saldo_proyectado_dia_boda')},
                })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-success)]">
                {formatCurrency(predictiveInsights.forecastSurplus || 0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/30">
              <p className="text-xs text-[color:var(--color-primary)]/80 uppercase tracking-wide">
                {t('finance.overview.recommendedSaving', {
                  defaultValue: 'Ahorro mensual recomendado',
                })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-primary)]">
                {formatCurrency(predictiveInsights.recommendedMonthlySaving || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predictiveInsights.categoriesAtRisk?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--color-text)] mb-2">
                  {t('finance.overview.categoriesAtRisk', {
                    defaultValue: {t('common.categorias_riesgo')},
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
                    defaultValue: {t('common.pagos_proximos')},
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

      {alertCategories.length > 0 && (
        <Card className="p-4 border-[color:var(--color-warning)]/30 bg-[var(--color-warning)]/10">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
            <div>
              <h3 className="font-medium text-[color:var(--color-warning)]">
                {t('finance.alerts.budget', { defaultValue: 'Alertas de Presupuesto' })}
              </h3>
              <div className="mt-2 space-y-1">
                {alertCategories.map((cat, index) => {
                  const action = () =>
                    handleNavigate({ categoryFilter: cat.name, typeFilter: 'expense' });
                  return (
                    <p
                      key={index}
                      className="text-sm text-[color:var(--color-warning)]/90 cursor-pointer underline-offset-2 hover:underline"
                      role="button"
                      tabIndex={0}
                      onClick={action}
                      onKeyDown={(event) => handleAccessibleClick(event, action)}
                    >
                      <span className="font-medium">{cat.name}</span>:{' '}
                      {toFinite(cat.percentage).toFixed(1)}%{' '}
                      {t('finance.overview.used', { defaultValue: 'utilizado' })}
                      {toFinite(cat.percentage) >= 100 &&
                        ` ${t('finance.overview.exceededNote', { defaultValue: '(Presupuesto excedido!)' })}`}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-4">
          {t('finance.overview.categoryStatus', {
            defaultValue: 'Estado del Presupuesto por Categor€)as',
          })}
        </h3>
        <div className="space-y-3">
          {safeBudget.map((category, index) => {
            const percentage = toFinite(category.percentage);
            const action = () =>
              handleNavigate({ categoryFilter: category.name, typeFilter: 'expense' });
            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-[var(--color-accent)]/10"
                role="button"
                tabIndex={0}
                onClick={action}
                onKeyDown={(event) => handleAccessibleClick(event, action)}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[color:var(--color-text)]/80">
                      {category.name}
                    </span>
                    <span className="text-sm text-[color:var(--color-text)]/60">
                      {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2 bg-[color:var(--color-text)]/10">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
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
                  className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(percentage)}`}
                >
                  <div className="flex items-center space-x-1">
                    {getBudgetIcon(percentage)}
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {projection?.summary && (
        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-3">
            {t('finance.overview.projectionTitle', { defaultValue: 'Proyección financiera' })}
          </h3>
          <p className="text-sm text-[color:var(--color-text)]/70 mb-4">
            {t('finance.overview.projectionHint', {
              defaultValue:
                'Estimaciones basadas en aportaciones configuradas, regalos esperados e importes pendientes.',
            })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-[var(--color-success)]/10 border border-[color:var(--color-success)]/30 rounded-md p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-success)]/80">
                {t('finance.overview.projectedAtWedding', { defaultValue: 'Balance el día de la boda' })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-success)]">
                {formatCurrency(projection.summary.projectedAtWedding ?? 0)}
              </p>
            </div>
            <div className="bg-[var(--color-warning)]/10 border border-[color:var(--color-warning)]/30 rounded-md p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-warning)]/80">
                {t('finance.overview.minBalance', { defaultValue: 'Punto de balance mínimo' })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-warning)]">
                {formatCurrency(projection.summary.minProjectedBalance ?? 0)}
              </p>
              {projection.summary.minProjectedBalanceDate && (
                <p className="text-xs text-[color:var(--color-text)]/60">
                  {t('finance.overview.onDate', { defaultValue: 'en' })}{' '}
                  {projection.summary.minProjectedBalanceDate}
                </p>
              )}
            </div>
            <div className="bg-[var(--color-text)]/5 border border-[color:var(--color-text)]/15 rounded-md p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/70">
                {t('finance.overview.riskDays', { defaultValue: 'Días en riesgo' })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-text)]">
                {projection.summary.riskDays ?? 0}
              </p>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.overview.totalProjectedGifts', {
                  defaultValue: 'Regalos proyectados:',
                })}{' '}
                {formatCurrency(projection.summary.totalProjectedGifts ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
