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

// Localized month label
const getMonthDate = (isoMonth) => {
  if (!isoMonth) return null;
  const parts = isoMonth.split('-');
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  return new Date(year, monthIndex, 1);
};

const computeBarScale = (values) => {
  const maxAbs = values.reduce((acc, value) => Math.max(acc, Math.abs(value)), 0);
  if (maxAbs === 0) return 1;
  return maxAbs;
};

const FinanceCashflowTimeline = ({
  monthlySeries,
  predictiveInsights,
  stats,
  budget,
  projection,
}) => {
  const { t, currentLanguage } = useTranslations();
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
      .filter((entry) => entry && entry.outstanding > 0 && entry.date >= now && entry.date <= limit)
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
      label: (() => {
        const date = getMonthDate(iso);
        if (!date) return iso;
        try {
          return new Intl.DateTimeFormat(currentLanguage || 'es', {
            month: 'short',
            year: 'numeric',
          }).format(date);
        } catch {
          return iso;
        }
      })(),
      net: netValues[index] || 0,
      income: incomeValues[index] || 0,
      expense: expenseValues[index] || 0,
      width: maxScale > 0 ? Math.abs(netValues[index] || 0) / maxScale : 0,
      positive: (netValues[index] || 0) >= 0,
    }));
  }, [monthlySeries, currentLanguage]);

  const budgetRemaining = Math.max(0, (stats?.totalBudget || 0) - (stats?.totalSpent || 0));
  const burnRate = predictiveInsights?.burnRate || 0;
  const monthsToZero = predictiveInsights?.monthsToZero || null;

  return (
    <div className="rounded-xl border border-[color:var(--color-text)]/10 bg-[var(--color-surface)] shadow-md overflow-hidden">
      <header className="border-b border-soft px-6 py-5 flex flex-wrap items-center justify-between gap-4 bg-[var(--color-primary)]/5">
        <div className="space-y-1.5">
          <h2 className="text-lg md:text-xl font-bold text-body tracking-tight">
            {t('finance.cashflow.title', { defaultValue: 'Cronograma de caja' })}
          </h2>
          <p className="text-xs text-muted font-medium">
            {t('finance.cashflow.subtitle', {
              defaultValue: 'Próximos pagos y balance proyectado',
            })}
          </p>
        </div>
        <div className="text-xs space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-success)]/10 border border-[color:var(--color-success)]/30">
            <span className="text-muted font-medium">
              {t('finance.cashflow.remaining', { defaultValue: 'Presupuesto restante' })}:
            </span>
            <span className="font-bold text-[color:var(--color-success)]">
              {formatCurrency(budgetRemaining)}
            </span>
          </div>
          {burnRate > 0 && monthsToZero != null && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30">
              <span className="text-muted font-medium">
                {t('finance.cashflow.burnRate', { defaultValue: 'Burn rate' })}:
              </span>
              <span className="font-bold text-[color:var(--color-danger)]">
                {formatCurrency(burnRate)}
              </span>
              <span className="text-muted">·</span>
              <span className="text-body font-semibold">
                {t('finance.cashflow.monthsToZero', {
                  defaultValue: '{{months}} meses',
                  months: monthsToZero.toFixed(1),
                })}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[var(--color-danger)] rounded-full" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-body">
              {t('finance.cashflow.upcoming', { defaultValue: 'Pagos próximos (45 días)' })}
            </h3>
          </div>
          {upcomingWithinWindow.length === 0 ? (
            <div className="flex items-center justify-center p-8 rounded-xl bg-[var(--color-success)]/5 border border-dashed border-[color:var(--color-success)]/30">
              <p className="text-sm text-muted font-medium">
                {t('finance.cashflow.noUpcoming', {
                  defaultValue: 'Sin pagos pendientes en las próximas semanas.',
                })}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingWithinWindow.map((payment, index) => (
                <li
                  key={`${payment.concept}-${payment.dueDate}-${index}`}
                  className="group flex items-center justify-between rounded-xl border border-soft bg-[var(--color-primary)] hover:bg-[var(--color-danger)]/5 px-4 py-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-body group-hover:text-[color:var(--color-danger)] transition-colors duration-200">
                      {payment.concept}
                    </p>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      {(() => {
                        try {
                          return new Intl.DateTimeFormat(currentLanguage || 'es', {
                            day: '2-digit',
                            month: 'short',
                          }).format(new Date(payment.date));
                        } catch {
                          return new Date(payment.date).toDateString();
                        }
                      })()}
                      {payment.provider ? ` · ${payment.provider}` : ''}
                    </p>
                  </div>
                  <span className="text-base font-bold text-[var(--color-danger)] px-3 py-1.5 rounded-lg bg-[var(--color-danger)]/10">
                    {formatCurrency(payment.outstanding)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[var(--color-primary)] rounded-full" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-body">
                {t('finance.cashflow.netTimeline', {
                  defaultValue: 'Flujo neto mensual (6 meses)',
                })}
              </h3>
            </div>
            <span className="text-xs text-muted font-semibold px-2 py-1 rounded bg-[var(--color-text)]/5">
              {t('finance.cashflow.legend', { defaultValue: 'Ingreso - Gasto' })}
            </span>
          </div>
          <div className="space-y-4">
            {monthlyBars.length === 0 ? (
              <div className="flex items-center justify-center p-8 rounded-xl bg-[var(--color-info)]/5 border border-dashed border-[color:var(--color-info)]/30">
                <p className="text-sm text-muted font-medium">
                  {t('finance.cashflow.noHistory', {
                    defaultValue: 'Necesitamos más historial para calcular la tendencia.',
                  })}
                </p>
              </div>
            ) : (
              monthlyBars.map((bar) => (
                <div
                  key={bar.label}
                  className="space-y-2 p-3 rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-semibold uppercase tracking-wide">
                      {bar.label}
                    </span>
                    <span
                      className={`font-bold px-2 py-1 rounded ${
                        bar.positive
                          ? 'text-[color:var(--color-success)] bg-[var(--color-success)]/10'
                          : 'text-[color:var(--color-danger)] bg-[var(--color-danger)]/10'
                      }`}
                    >
                      {formatCurrency(bar.net)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[color:var(--color-text)]/10 overflow-hidden shadow-inner">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 shadow-md ${
                        bar.positive
                          ? 'bg-[var(--color-success)]'
                          : 'bg-[var(--color-danger)]'
                      }`}
                      style={{ width: `${Math.max(bar.width * 100, 5)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
                    <span className="text-[color:var(--color-success)]">
                      {t('finance.cashflow.income', { defaultValue: 'Ingresos' })}:{' '}
                      {formatCurrency(bar.income)}
                    </span>
                    <span className="text-[color:var(--color-danger)]">
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

      {/* 📊 PROYECCIÓN FINANCIERA INTEGRADA */}
      {projection?.summary && (
        <div className="border-t border-soft px-6 py-6 bg-[var(--color-primary)]/5">
          <div className="mb-4">
            <h3 className="text-lg md:text-xl font-bold text-body tracking-tight mb-1">
              {t('finance.overview.projectionTitle', { defaultValue: 'Proyección financiera' })}
            </h3>
            <p className="text-xs text-muted font-medium">
              {t('finance.overview.projectionHint', {
                defaultValue: 'Estimaciones basadas en aportaciones configuradas, regalos esperados e importes pendientes.',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div className="group bg-[var(--color-success)]/15 border border-[color:var(--color-success)]/30 rounded-xl p-4 shadow-md hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-wider text-[color:var(--color-success)] font-bold mb-2">
                {t('finance.overview.projectedAtWedding', {
                  defaultValue: 'Balance el día de la boda',
                })}
              </p>
              <p className="text-xl md:text-2xl font-bold text-[color:var(--color-success)]">
                {formatCurrency(projection.summary.projectedAtWedding ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCashflowTimeline;
