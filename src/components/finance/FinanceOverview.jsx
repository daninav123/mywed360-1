import React from 'react';
import { Card } from '../ui';
import { Cloud, CloudOff, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--color-text)]">
            {t('finance.overview.title', { defaultValue: 'Gestión Financiera' })}
          </h1>
          <p className="text-[color:var(--color-text)]/70 mt-1">
            {t('finance.overview.subtitle', { defaultValue: 'Control completo de presupuesto y gastos de tu boda' })}
          </p>
          {syncStatus?.lastSyncTime && (
            <p className="text-xs text-[color:var(--color-text)]/50 mt-1">
              {t('finance.overview.lastSync', { defaultValue: 'Última sincronización' })}: {new Date(syncStatus.lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {syncStatus?.isOnline ? (
            <div className="flex items-center text-[color:var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1 rounded-full">
              <Cloud size={16} className="mr-2" />
              <span className="text-sm font-medium">{t('finance.overview.synced', { defaultValue: 'Sincronizado' })}</span>
            </div>
          ) : (
            <div className="flex items-center text-[color:var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1 rounded-full">
              <CloudOff size={16} className="mr-2" />
              <span className="text-sm font-medium">{t('finance.overview.offline', { defaultValue: 'Sin conexión' })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">{t('finance.overview.totalBudget', { defaultValue: 'Presupuesto Total' })}</p>
              <p className="text-2xl font-bold text-[color:var(--color-text)]">{formatCurrency(effectiveTotal)}</p>
            </div>
            <div className="p-3 bg-[var(--color-primary)]/15 rounded-full">
              <TrendingUp className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card {...clickableCardProps({ typeFilter: 'expense' })}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">{t('finance.overview.totalSpent', { defaultValue: 'Total Gastado' })}</p>
              <p className="text-2xl font-bold text-[color:var(--color-danger)]">{formatCurrency(safeStats.totalSpent)}</p>
              <p className="text-xs text-[color:var(--color-text)]/60 mt-1">{budgetPercent.toFixed(1)}% {t('finance.overview.ofBudget', { defaultValue: 'del presupuesto' })}</p>
            </div>
            <div className="p-3 bg-[var(--color-danger)]/10 rounded-full">
              <TrendingDown className="w-6 h-6 text-[color:var(--color-danger)]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">{t('finance.overview.currentBalance', { defaultValue: 'Balance Actual' })}</p>
              <p className={`text-2xl font-bold ${safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>{formatCurrency(safeStats.currentBalance)}</p>
            </div>
            <div className={`p-3 rounded-full ${safeStats.currentBalance >= 0 ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-danger)]/10'}`}>
              {safeStats.currentBalance >= 0 ? (
                <CheckCircle className="w-6 h-6 text-[color:var(--color-success)]" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[color:var(--color-danger)]" />
              )}
            </div>
          </div>
        </Card>

        <Card {...clickableCardProps({ typeFilter: 'income' })}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">{t('finance.overview.expectedIncome', { defaultValue: 'Ingresos Esperados' })}</p>
              <p className="text-2xl font-bold text-[color:var(--color-success)]">{formatCurrency(safeStats.expectedIncome)}</p>
            </div>
            <div className="p-3 bg-[var(--color-success)]/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-[color:var(--color-success)]" />
            </div>
          </div>
        </Card>
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-4">
          {t('finance.overview.categoryStatus', { defaultValue: 'Estado del Presupuesto por Categorías' })}
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
