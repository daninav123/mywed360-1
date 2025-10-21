import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import React from 'react';

import { Card, Button } from '../ui';
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
  const availableAmount = effectiveTotal - totalSpent;

  const safeStats = {
    totalBudget,
    totalSpent,
    totalIncome: toFinite(stats?.totalIncome),
    currentBalance: toFinite(stats?.currentBalance),
    expectedIncome,
  };

  const handleNavigate = (payload) => {
    if (typeof onNavigate !== 'function') return;
    if (payload?.tab) {
      onNavigate(payload);
    } else {
      onNavigate({ tab: 'transactions', filters: payload });
    }
  };

  const alertCategories = safeBudget.filter(
    (cat) => !cat.muted && toFinite(cat.percentage) >= warnThreshold
  );
  const limitedAlerts = alertCategories.slice(0, 3);

  const monthly = React.useMemo(() => {
    const arr = Array.isArray(transactions) ? transactions : [];
    const months = [];
    const mapInc = new Map();
    const mapExp = new Map();
    const now = new Date();
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
      if (!mapInc.has(key)) continue;
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
      if (prev === 0)
        return {
          value: last === 0 ? 0 : 100,
          trend: last > 0 ? 'up' : last < 0 ? 'down' : 'neutral',
        };
      const pct = ((last - prev) / Math.abs(prev)) * 100;
      return { value: Math.abs(pct), trend: last > prev ? 'up' : last < prev ? 'down' : 'neutral' };
    };
    return {
      deltaIncome: computeDelta(income),
      deltaExpense: computeDelta(expense),
      deltaBalance: computeDelta(balance),
    };
  }, [transactions]);

  const projectedBalance =
    projection && Number.isFinite(Number(projection?.projectedBalance))
      ? Number(projection.projectedBalance)
      : safeStats.currentBalance;

  const heroStats = [
    {
      id: 'total',
      label: t('finance.overview.totalBudget', { defaultValue: 'Presupuesto total' }),
      value: formatCurrency(effectiveTotal),
      tone: 'primary',
      hint:
        expectedIncome > 0
          ? t('finance.overview.expectedIncome', {
              defaultValue: 'Incluye ingresos esperados',
            })
          : t('finance.overview.configuredBudget', {
              defaultValue: 'Según presupuesto configurado',
            }),
    },
    {
      id: 'spent',
      label: t('finance.overview.totalSpent', { defaultValue: 'Total gastado' }),
      value: formatCurrency(safeStats.totalSpent),
      tone: 'danger',
      hint: `${budgetPercent.toFixed(1)}% ${t('finance.overview.ofBudget', {
        defaultValue: 'del presupuesto',
      })}`,
      delta: monthly.deltaExpense,
    },
    {
      id: 'available',
      label: t('finance.overview.available', { defaultValue: 'Disponible' }),
      value: formatCurrency(Math.max(availableAmount, 0)),
      tone: availableAmount >= 0 ? 'success' : 'danger',
      hint:
        availableAmount >= 0
          ? t('finance.overview.clearBalance', { defaultValue: 'Saldo libre estimado' })
          : t('finance.overview.overBudget', { defaultValue: 'Sobre el presupuesto' }),
    },
    {
      id: 'projection',
      label: t('finance.overview.projection', { defaultValue: 'Proyección' }),
      value: formatCurrency(projectedBalance),
      tone: projectedBalance >= 0 ? 'success' : 'warning',
      hint:
        projection?.confidenceInterval != null
          ? `${t('finance.overview.confidence', { defaultValue: 'Confianza' })}: ${Math.round(
              projection.confidenceInterval * 100
            )}%`
          : t('finance.overview.currentBalance', { defaultValue: 'Balance actual' }),
      delta: monthly.deltaBalance,
    },
  ];

  const [insightsOpen, setInsightsOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-[var(--color-surface)]/70 border-soft shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {heroStats.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[color:var(--color-text)]/10 bg-white/75 dark:bg-[var(--color-surface)]/90 p-4 shadow-sm flex flex-col gap-1"
            >
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">
                {item.label}
              </p>
              <p
                className={`text-2xl font-semibold ${
                  item.tone === 'danger'
                    ? 'text-[color:var(--color-danger)]'
                    : item.tone === 'success'
                    ? 'text-[color:var(--color-success)]'
                    : item.tone === 'warning'
                    ? 'text-[color:var(--color-warning)]'
                    : 'text-[color:var(--color-text)]'
                }`}
              >
                {item.value}
              </p>
              {item.delta && (
                <span
                  className={`text-xs ${
                    item.delta.trend === 'up'
                      ? 'text-[color:var(--color-success)]'
                      : item.delta.trend === 'down'
                      ? 'text-[color:var(--color-danger)]'
                      : 'text-[color:var(--color-text)]/60'
                  }`}
                >
                  {item.delta.trend === 'up'
                    ? t('finance.overview.delta.up', {
                        defaultValue: '+{{value}} % vs. mes anterior',
                        value: item.delta.value.toFixed(1),
                      })
                    : item.delta.trend === 'down'
                    ? t('finance.overview.delta.down', {
                        defaultValue: '-{{value}} % vs. mes anterior',
                        value: item.delta.value.toFixed(1),
                      })
                    : t('finance.overview.delta.flat', {
                        defaultValue: 'Sin cambios vs. mes anterior',
                      })}
                </span>
              )}
              <span className="text-xs text-[color:var(--color-text)]/60">{item.hint}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[color:var(--color-primary)]/40 text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10"
          onClick={() => handleNavigate({ tab: 'budget' })}
        >
          <TrendingUp size={16} />
          {t('finance.overview.quickAccessBudget', { defaultValue: 'Ir a presupuesto' })}
        </Button>
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[color:var(--color-success)]/40 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/10"
          onClick={() => handleNavigate({ tab: 'contributions' })}
        >
          <CheckCircle size={16} />
          {t('finance.overview.quickAccessContributions', { defaultValue: 'Ver aportaciones' })}
        </Button>
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2 text-sm px-3 py-2 border border-[color:var(--color-text)]/20 text-[color:var(--color-text)]/80 hover:bg-[color:var(--color-text)]/5"
          onClick={() => handleNavigate({ tab: 'transactions' })}
        >
          <TrendingDown size={16} />
          {t('finance.overview.quickAccessTransactions', {
            defaultValue: 'Revisar transacciones',
          })}
        </Button>
      </div>

      {projection && (
        <Card className="p-6 bg-[var(--color-accent)]/5 border-[color:var(--color-accent)]/20 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
                {t('finance.overview.projectionTitle', { defaultValue: 'Proyección financiera' })}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.overview.projectionHint', {
                  defaultValue:
                    'Estimaciones basadas en aportaciones, pagos pendientes y regalos previstos.',
                })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-md border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-success)]/70">
                {t('finance.overview.projectedAtWedding', {
                  defaultValue: 'Balance el día de la boda',
                })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-success)]">
                {formatCurrency(projection.summary?.projectedAtWedding ?? projectedBalance)}
              </p>
            </div>
            <div className="rounded-md border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-warning)]/70">
                {t('finance.overview.minBalance', { defaultValue: 'Punto de balance mínimo' })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-warning)]">
                {formatCurrency(projection.summary?.minProjectedBalance ?? 0)}
              </p>
              {projection.summary?.minProjectedBalanceDate && (
                <p className="text-xs text-[color:var(--color-text)]/60">
                  {projection.summary.minProjectedBalanceDate}
                </p>
              )}
            </div>
            <div className="rounded-md border border-[color:var(--color-text)]/15 bg-[color:var(--color-text)]/5 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">
                {t('finance.overview.totalProjectedGifts', {
                  defaultValue: 'Regalos proyectados',
                })}
              </p>
              <p className="text-lg font-semibold text-[color:var(--color-text)]">
                {formatCurrency(projection.summary?.totalProjectedGifts ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {predictiveInsights && (
        <Card className="overflow-hidden border-soft bg-[var(--color-surface)]/80 backdrop-blur">
          <button
            type="button"
            onClick={() => setInsightsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[color:var(--color-primary)]/5 transition"
          >
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-text)]">
                {t('finance.overview.aiInsights', { defaultValue: 'Sugerencias predictivas' })}
              </p>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.overview.aiInsightsHint', {
                  defaultValue: 'Recomendaciones breves basadas en tus movimientos recientes.',
                })}
              </p>
            </div>
            {insightsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {insightsOpen && (
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictiveInsights.recommendedMonthlySaving != null && (
                  <div className="rounded-lg border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-[color:var(--color-primary)]/70">
                      {t('finance.overview.recommendedSaving', {
                        defaultValue: 'Ahorro mensual recomendado',
                      })}
                    </p>
                    <p className="text-lg font-semibold text-[color:var(--color-primary)]">
                      {formatCurrency(predictiveInsights.recommendedMonthlySaving || 0)}
                    </p>
                  </div>
                )}
                {predictiveInsights.cashflowRisk && (
                  <div className="rounded-lg border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-[color:var(--color-warning)]/70">
                      {t('finance.overview.cashflowRisk', { defaultValue: 'Riesgo de liquidez' })}
                    </p>
                    <p className="text-sm text-[color:var(--color-warning)]">
                      {predictiveInsights.cashflowRisk}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            </div>
          )}
        </Card>
      )}

      {limitedAlerts.length > 0 && (
        <Card className="p-4 border-[color:var(--color-warning)]/30 bg-[var(--color-warning)]/10">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
            <div>
              <h3 className="font-medium text-[color:var(--color-warning)]">
                {t('finance.alerts.budget', { defaultValue: 'Alertas de presupuesto' })}
              </h3>
              <div className="mt-2 space-y-1">
                {limitedAlerts.map((cat, index) => {
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
                        ` ${t('finance.overview.exceededNote', {
                          defaultValue: '(Presupuesto excedido)',
                        })}`}
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
            defaultValue: 'Estado del presupuesto por categorías',
          })}
        </h3>
        <div className="space-y-3">
          {safeBudget.length === 0 ? (
            <p className="text-sm text-[color:var(--color-text)]/60">
              {t('finance.overview.noBudget', {
                defaultValue: 'Todavía no has configurado categorías de presupuesto.',
              })}
            </p>
          ) : (
            safeBudget.map((category, index) => {
              const percentage = toFinite(category.percentage);
              const action = () =>
                handleNavigate({ categoryFilter: category.name, typeFilter: 'expense' });
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--color-accent)]/10 transition"
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
                    className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(
                      percentage
                    )}`}
                  >
                    <div className="flex items-center space-x-1">
                      {getBudgetIcon(percentage)}
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

