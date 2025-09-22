import React from 'react';
import { Card } from '../ui';
import StatCard from './StatCard';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

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
  syncStatus,
  budgetUsage = [],
  thresholds = { warn: 75, danger: 90 },
  onNavigate,
  isLoading = false,
  transactions = [],
}) {
  const { t } = useTranslations();
  const safeBudget = Array.isArray(budgetUsage) ? budgetUsage : [];

  const warnThreshold = thresholds?.warn ?? 75;
  const dangerThreshold = thresholds?.danger ?? 90;

  const getBudgetStatusColor = (percentage) => {
    if (percentage >= dangerThreshold) return 'text-[color:var(--color-danger)] bg-[var(--color-danger)]/10';
    if (percentage >= warnThreshold) return 'text-[color:var(--color-warning)] bg-[var(--color-warning)]/10';
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
  const effectiveTotal = expectedIncome > 0 ? expectedIncome : totalBudget > 0 ? totalBudget : fallbackTotal;
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
    className: 'p-6 cursor-pointer transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/40',
    onClick: () => handleNavigate(filters),
    onKeyDown: (event) => handleAccessibleClick(event, () => handleNavigate(filters)),
  });

  const alertCategories = safeBudget.filter((cat) => !cat.muted && toFinite(cat.percentage) >= warnThreshold);

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
          value={<span className="text-[color:var(--color-danger)]">{formatCurrency(safeStats.totalSpent)}</span>}
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
            <span className={safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}>
              {formatCurrency(safeStats.currentBalance)}
            </span>
          }
          icon={safeStats.currentBalance >= 0 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
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
          value={<span className="text-[color:var(--color-success)]">{formatCurrency(safeStats.expectedIncome)}</span>}
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

      {alertCategories.length > 0 && (
        <Card className="p-4 border-[color:var(--color-warning)]/30 bg-[var(--color-warning)]/10">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
            <div>
              <h3 className="font-medium text-[color:var(--color-warning)]">{t('finance.alerts.budget', { defaultValue: 'Alertas de Presupuesto' })}</h3>
              <div className="mt-2 space-y-1">
                {alertCategories.map((cat, index) => {
                  const action = () => handleNavigate({ categoryFilter: cat.name, typeFilter: 'expense' });
                  return (
                    <p
                      key={index}
                      className="text-sm text-[color:var(--color-warning)]/90 cursor-pointer underline-offset-2 hover:underline"
                      role="button"
                      tabIndex={0}
                      onClick={action}
                      onKeyDown={(event) => handleAccessibleClick(event, action)}
                    >
                      <span className="font-medium">{cat.name}</span>: {toFinite(cat.percentage).toFixed(1)}% {t('finance.overview.used', { defaultValue: 'utilizado' })}
                      {toFinite(cat.percentage) >= 100 && ` ${t('finance.overview.exceededNote', { defaultValue: '(Presupuesto excedido!)' })}`}
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
          {t('finance.overview.categoryStatus', { defaultValue: 'Estado del Presupuesto por Categoras' })}
        </h3>
        <div className="space-y-3">
          {safeBudget.map((category, index) => {
            const percentage = toFinite(category.percentage);
            const action = () => handleNavigate({ categoryFilter: category.name, typeFilter: 'expense' });
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
                    <span className="text-sm font-medium text-[color:var(--color-text)]/80">{category.name}</span>
                    <span className="text-sm text-[color:var(--color-text)]/60">{formatCurrency(category.spent)} / {formatCurrency(category.amount)}</span>
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
                <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(percentage)}`}>
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
    </div>
  );
}
