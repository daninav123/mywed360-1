import React, { useMemo } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';

const MAX_MONTHS = 6;
const UPCOMING_WINDOW_DAYS = 45;

const parseISODate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthLabel = (isoMonth) => {
  if (!isoMonth) return '';
  const parts = isoMonth.split('-');
  if (parts.length < 2) return isoMonth;
  const year = parts[0];
  const monthIndex = Number(parts[1]) - 1;
  const date = new Date(Number(year), monthIndex, 1);
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const computeBarScale = (values) => {
  const maxAbs = values.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
  if (maxAbs === 0) return 1;
  return maxAbs;
};

const FinanceCashflowTimeline = ({ monthlySeries, predictiveInsights, stats, budget }) => {
  const { t } = useTranslations();
  const upcomingPayments = Array.isArray(predictiveInsights?.upcomingPayments)
    ? predictiveInsights.upcomingPayments
    : [];

  const upcomingWithinWindow = useMemo(() => {
    if (!upcomingPayments.length) return [];
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + UPCOMING_WINDOW_DAYS);
    return upcomingPayments
      .map((payment) => {
        const date = parseISODate(payment.dueDate);
        if (!date) return null;
        return { ...payment, date };
      })
      .filter(
        (entry) =>
          entry &&
          entry.outstanding > 0 &&
          entry.date >= now &&
          entry.date <= limit
      )
      .slice(0, 6);
  }, [upcomingPayments]);

  const monthlyBars = useMemo(() => {
    if (!monthlySeries || !Array.isArray(monthlySeries.months)) return [];
    const length = monthlySeries.months.length;
    const start = Math.max(0, length - MAX_MONTHS);
    const months = monthlySeries.months.slice(start);
    const netValues = monthlySeries.net.slice(start);
    const incomeValues = monthlySeries.income.slice(start);
    const expenseValues = monthlySeries.expense.slice(start);
    const maxScale = computeBarScale(netValues);
    return months.map((iso, index) => ({
      label: getMonthLabel(iso),
      net: netValues[index] || 0,
      income: incomeValues[index] || 0,
      expense: expenseValues[index] || 0,
      width: maxScale > 0 ? Math.abs(netValues[index] || 0) / maxScale : 0,
      positive: (netValues[index] || 0) >= 0,
    }));
  }, [monthlySeries]);

  const budgetRemaining = Math.max(0, (stats?.totalBudget || 0) - (stats?.totalSpent || 0));
  const burnRate = predictiveInsights?.burnRate || 0;
  const monthsToZero = predictiveInsights?.monthsToZero || null;

  return (
    <div className="rounded-xl border border-soft bg-surface shadow-sm">
      <header className="border-b border-soft px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-body">
            {t('finance.cashflow.title', { defaultValue: 'Cronograma de caja' })}
          </h2>
          <p className="text-xs text-muted">
            {t('finance.cashflow.subtitle', {
              defaultValue: 'Próximos pagos y balance proyectado',
            })}
          </p>
        </div>
        <div className="text-xs text-muted space-y-1">
          <p>
            {t('finance.cashflow.remaining', { defaultValue: 'Presupuesto restante' })}:{' '}
            <span className="font-semibold text-body">
              {formatCurrency(budgetRemaining)}
            </span>
          </p>
          {burnRate > 0 && monthsToZero != null && (
            <p>
              {t('finance.cashflow.burnRate', { defaultValue: 'Burn rate mensual' })}:{' '}
              <span className="font-semibold text-body">
                {formatCurrency(burnRate)}
              </span>{' '}
              ·{' '}
              {t('finance.cashflow.monthsToZero', {
                defaultValue: '{{months}} meses hasta agotar',
                months: monthsToZero.toFixed(1),
              })}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t('finance.cashflow.upcoming', { defaultValue: 'Pagos próximos (45 días)' })}
            </h3>
          </div>
          {upcomingWithinWindow.length === 0 ? (
            <p className="text-sm text-muted">
              {t('finance.cashflow.noUpcoming', { defaultValue: 'Sin pagos pendientes en las próximas semanas.' })}
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingWithinWindow.map((payment, index) => (
                <li
                  key={`${payment.concept}-${payment.dueDate}-${index}`}
                  className="flex items-center justify-between rounded-md border border-soft bg-white/80 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-body">
                      {payment.concept}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(payment.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {payment.provider ? ` · ${payment.provider}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--color-danger)]">
                    {formatCurrency(payment.outstanding)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t('finance.cashflow.netTimeline', { defaultValue: 'Flujo neto mensual (6 meses)' })}
            </h3>
            <span className="text-xs text-muted">
              {t('finance.cashflow.legend', { defaultValue: 'Ingreso - Gasto' })}
            </span>
          </div>
          <div className="space-y-3">
            {monthlyBars.length === 0 ? (
              <p className="text-sm text-muted">
                {t('finance.cashflow.noHistory', { defaultValue: 'Necesitamos más historial para calcular la tendencia.' })}
              </p>
            ) : (
              monthlyBars.map((bar) => (
                <div key={bar.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{bar.label}</span>
                    <span className="font-semibold text-body">
                      {formatCurrency(bar.net)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-soft overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bar.positive ? 'bg-success-soft' : 'bg-[var(--color-danger)]/70'
                      }`}
                      style={{ width: `${Math.max(bar.width * 100, 5)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted">
                    <span>
                      {t('finance.cashflow.income', { defaultValue: 'Ingresos' })}:{' '}
                      {formatCurrency(bar.income)}
                    </span>
                    <span>
                      {t('finance.cashflow.expense', { defaultValue: 'Gastos' })}:{' '}
                      {formatCurrency(bar.expense)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FinanceCashflowTimeline;
