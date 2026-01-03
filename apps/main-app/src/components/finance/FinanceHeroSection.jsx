import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';
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
  onNavigate,
  transactions = [],
  predictiveInsights = null
}) {
  const { t } = useTranslations();
  
  // Métricas básicas
  const currentBalance = toFinite(stats?.currentBalance);
  const totalIncome = toFinite(stats?.totalIncome);
  const expectedIncome = toFinite(stats?.expectedIncome);
  const totalSpent = toFinite(stats?.totalSpent);
  const overdueExpenses = toFinite(stats?.overdueExpenses);
  const pendingExpenses = toFinite(stats?.pendingExpenses);
  
  // Disponible AHORA (saldo inicial + ingresos confirmados - gastado + ajustes)
  const initialBalance = toFinite(stats?.initialBalance);
  const adjustments = toFinite(stats?.adjustments);
  const availableNow = initialBalance + totalIncome - totalSpent + adjustments;
  
  // Análisis de pagos críticos
  const paymentAnalysis = useMemo(() => {
    if (!Array.isArray(transactions)) return { overdue: [], upcoming7d: [], upcoming30d: [], nextPayment: null };
    
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const overdue = [];
    const upcoming7d = [];
    const upcoming30d = [];
    const allUpcoming = [];
    
    transactions.forEach(tx => {
      if (tx.type !== 'expense' || tx.status === 'paid') return;
      if (!tx.dueDate) return;
      
      const dueDate = new Date(tx.dueDate);
      if (isNaN(dueDate.getTime())) return;
      
      const amount = toFinite(tx.amount);
      const paid = toFinite(tx.paidAmount);
      const outstanding = Math.max(0, amount - paid);
      
      if (outstanding <= 0) return;
      
      if (dueDate < now) {
        overdue.push({ ...tx, outstanding, dueDate });
      } else {
        allUpcoming.push({ ...tx, outstanding, dueDate });
        if (dueDate <= in7Days) {
          upcoming7d.push({ ...tx, outstanding, dueDate });
        } else if (dueDate <= in30Days) {
          upcoming30d.push({ ...tx, outstanding, dueDate });
        }
      }
    });
    
    // Próximo pago: el más cercano en el futuro
    const nextPayment = allUpcoming.length > 0 
      ? allUpcoming.sort((a, b) => a.dueDate - b.dueDate)[0]
      : null;
    
    return { overdue, upcoming7d, upcoming30d, nextPayment };
  }, [transactions]);
  
  // Runway (días hasta quedarse sin fondos)
  const runway = useMemo(() => {
    const monthsToZero = predictiveInsights?.monthsToZero;
    if (monthsToZero == null || monthsToZero === Infinity) return null;
    return Math.round(monthsToZero * 30); // Convertir meses a días
  }, [predictiveInsights]);
  
  // Estado de categorías
  const categoryStatus = useMemo(() => {
    const ok = budgetUsage.filter(cat => !cat.muted && toFinite(cat.percentage) < thresholds.warn).length;
    const warning = budgetUsage.filter(cat => !cat.muted && toFinite(cat.percentage) >= thresholds.warn && toFinite(cat.percentage) < thresholds.danger).length;
    const critical = budgetUsage.filter(cat => !cat.muted && toFinite(cat.percentage) >= thresholds.danger).length;
    return { ok, warning, critical };
  }, [budgetUsage, thresholds]);
  
  // Determinar estado de salud general
  const isHealthy = availableNow >= 0 && paymentAnalysis.overdue.length === 0;
  const isAtRisk = availableNow < 0 || paymentAnalysis.overdue.length > 0 || categoryStatus.critical > 0;
  const isWarning = !isHealthy && !isAtRisk;

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* HERO CARD - Disponible Ahora */}
      <Card className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Header - Disponible Ahora */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-muted" />
                <p className="text-sm font-bold uppercase tracking-wider text-muted">
                  {t('finance.hero.availableNow', { defaultValue: 'Disponible Ahora' })}
                </p>
              </div>
              {isLoading ? (
                <div className="h-16 md:h-20 w-64 bg-[color:var(--color-text-10)] rounded-xl animate-pulse" />
              ) : (
                <>
                  <h1 
                    className="text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-300"
                    style={{ color: colorMap[healthColor] }}
                  >
                    {formatCurrency(availableNow)}
                  </h1>
                  <p className="text-sm text-muted mt-2">
                    {t('finance.hero.ofConfirmed', { defaultValue: 'De' })} {formatCurrency(totalIncome + expectedIncome)} {t('finance.hero.confirmed', { defaultValue: 'confirmados' })}
                  </p>
                </>
              )}
            </div>
            <div className="p-4 md:p-5 rounded-2xl bg-[var(--color-text-5)] shadow-sm">
              {isHealthy ? (
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10" style={{ color: colorMap[healthColor] }} />
              ) : (
                <TrendingDown className="w-8 h-8 md:w-10 md:h-10" style={{ color: colorMap[healthColor] }} />
              )}
            </div>
          </div>

          {/* Próximo Pago y Runway */}
          {!isLoading && (
            <div className="grid grid-cols-2 gap-4">
              {/* Próximo Pago Individual */}
              <div className="bg-[var(--color-text-5)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {t('finance.hero.nextPayment', { defaultValue: 'Próximo pago' })}
                  </p>
                </div>
                {paymentAnalysis.nextPayment ? (
                  <>
                    <p className="text-xl font-bold text-[color:var(--color-warning)]">
                      {formatCurrency(paymentAnalysis.nextPayment.outstanding)}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(paymentAnalysis.nextPayment.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {paymentAnalysis.nextPayment.concept || paymentAnalysis.nextPayment.description || 'Sin concepto'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    {t('finance.hero.noPayments', { defaultValue: 'Sin pagos' })}
                  </p>
                )}
              </div>
              
              {/* Runway */}
              <div className="bg-[var(--color-text-5)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {t('finance.hero.runway', { defaultValue: 'Runway' })}
                  </p>
                </div>
                {runway ? (
                  <>
                    <p className="text-xl font-bold text-body">{runway}d</p>
                    <p className="text-xs text-muted mt-1">
                      {t('finance.hero.runwayDesc', { defaultValue: 'Hasta quedarte sin fondos' })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    {t('finance.hero.runwayUnknown', { defaultValue: 'Estable' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Urgente: Pagos Vencidos */}
          {!isLoading && paymentAnalysis.overdue.length > 0 && (
            <div className="pt-4 border-t border-soft">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[color:var(--color-danger)]" />
                <h4 className="text-sm font-bold text-[color:var(--color-danger)]">
                  {t('finance.hero.overdue', { defaultValue: '⚠️ Pagos Vencidos' })}
                </h4>
              </div>
              <div className="bg-[var(--color-danger-10)] border border-[color:var(--color-danger-30)] rounded-lg p-3">
                <p className="text-lg font-black text-[color:var(--color-danger)]">
                  {paymentAnalysis.overdue.length} {t('finance.hero.payments', { defaultValue: 'pagos' })}: {formatCurrency(overdueExpenses)}
                </p>
                <button
                  onClick={() => onNavigate?.({ statusFilter: 'overdue' })}
                  className="text-xs text-[color:var(--color-danger)] hover:underline mt-1"
                >
                  {t('finance.hero.viewDetails', { defaultValue: 'Ver detalles →' })}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Estado de Categorías */}
      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-muted mb-4">
              {t('finance.hero.budgetStatus', { defaultValue: 'Estado del Presupuesto' })}
            </p>
          </div>

          {/* Categorías OK */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-success-10)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                {t('finance.hero.categoriesOk', { defaultValue: '✅ Categorías OK' })}
              </p>
              <p className="text-2xl font-bold text-[color:var(--color-success)]">
                {categoryStatus.ok}
              </p>
            </div>
          </div>

          {/* Categorías en Alerta */}
          {categoryStatus.warning > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-warning-10)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  {t('finance.hero.categoriesWarning', { defaultValue: '⚠️ En alerta (>75%)' })}
                </p>
                <p className="text-2xl font-bold text-[color:var(--color-warning)]">
                  {categoryStatus.warning}
                </p>
              </div>
            </div>
          )}

          {/* Categorías Críticas */}
          {categoryStatus.critical > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-danger-10)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  {t('finance.hero.categoriesCritical', { defaultValue: '🔴 Críticas (>90%)' })}
                </p>
                <p className="text-2xl font-bold text-[color:var(--color-danger)]">
                  {categoryStatus.critical}
                </p>
              </div>
            </div>
          )}

          <div className="h-px bg-soft" />

          {/* Resumen Financiero */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t('finance.hero.spent', { defaultValue: 'Gastado' })}</span>
              <span className="font-bold text-body">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('finance.hero.pending', { defaultValue: 'Pendiente' })}</span>
              <span className="font-bold text-[color:var(--color-warning)]">{formatCurrency(pendingExpenses)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
