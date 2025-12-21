import React, { useMemo } from 'react';
import { AlertTriangle, Calendar, TrendingDown, Info } from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Componente que muestra alertas de pagos próximos y saldo insuficiente
 * @param {Object} props
 * @param {Array} props.transactions - Array de transacciones
 * @param {number} props.currentBalance - Saldo actual disponible
 * @param {number} props.daysLookahead - Días hacia adelante para calcular (default: 90)
 */
export default function UpcomingPaymentsAlert({ transactions, currentBalance, daysLookahead = 90 }) {
  const alerts = useMemo(() => {
    const now = new Date();
    const lookaheadDate = new Date();
    lookaheadDate.setDate(now.getDate() + daysLookahead);

    // Filtrar gastos pendientes futuros
    const upcomingExpenses = (transactions || [])
      .filter(tx => {
        if (tx.type !== 'expense') return false;
        if (tx.status === 'paid') return false;
        if (!tx.dueDate) return false;

        const dueDate = new Date(tx.dueDate);
        return dueDate >= now && dueDate <= lookaheadDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (upcomingExpenses.length === 0) {
      return { hasAlerts: false, alerts: [], upcomingExpenses: [] };
    }

    // Simular balance día a día
    const alertsList = [];
    let simulatedBalance = currentBalance || 0;
    const processedDates = new Set();

    for (const expense of upcomingExpenses) {
      const dueDate = new Date(expense.dueDate);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      if (processedDates.has(dueDateStr)) continue;
      processedDates.add(dueDateStr);

      // Sumar gastos del mismo día
      const dayExpenses = upcomingExpenses.filter(tx => {
        const txDate = new Date(tx.dueDate).toISOString().split('T')[0];
        return txDate === dueDateStr;
      });

      const dayTotal = dayExpenses.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Verificar saldo insuficiente
      if (simulatedBalance < dayTotal) {
        const deficit = dayTotal - simulatedBalance;
        alertsList.push({
          type: 'insufficient_balance',
          severity: 'high',
          date: dueDateStr,
          dateObj: dueDate,
          currentBalance: simulatedBalance,
          required: dayTotal,
          deficit,
          transactions: dayExpenses
        });
      }

      simulatedBalance -= dayTotal;
    }

    return {
      hasAlerts: alertsList.length > 0,
      alerts: alertsList,
      upcomingExpenses
    };
  }, [transactions, currentBalance, daysLookahead]);

  if (!alerts.hasAlerts && alerts.upcomingExpenses.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getDaysUntil = (dateStr) => {
    const now = new Date();
    const target = new Date(dateStr);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {/* Alertas de saldo insuficiente */}
      {alerts.hasAlerts && (
        <Card className="border-[var(--color-danger)] bg-[var(--color-danger-10)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[color:var(--color-danger)] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-[color:var(--color-text)] mb-2">
                ⚠️ Alerta de saldo insuficiente
              </h3>
              <p className="text-sm text-[color:var(--color-text-75)] mb-4">
                No tendrás saldo suficiente para cubrir los siguientes pagos programados:
              </p>

              <div className="space-y-3">
                {alerts.alerts.map((alert, index) => {
                  const daysUntil = getDaysUntil(alert.date);
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-white border border-[var(--color-danger-50)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-[color:var(--color-text)]">
                            {formatDate(alert.date)}
                          </p>
                          <p className="text-xs text-[color:var(--color-text-60)]">
                            {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[color:var(--color-text-60)]">Déficit</p>
                          <p className="font-bold text-[color:var(--color-danger)]">
                            -{formatCurrency(alert.deficit)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-[color:var(--color-text-60)]">Saldo disponible: </span>
                          <span className="font-semibold">{formatCurrency(alert.currentBalance)}</span>
                        </div>
                        <div>
                          <span className="text-[color:var(--color-text-60)]">Total necesario: </span>
                          <span className="font-semibold">{formatCurrency(alert.required)}</span>
                        </div>
                      </div>

                      <div className="border-t border-[var(--color-border)] pt-2 mt-2">
                        <p className="text-xs font-semibold text-[color:var(--color-text-75)] mb-1">
                          Pagos programados:
                        </p>
                        <ul className="space-y-1">
                          {alert.transactions.map((tx, txIndex) => (
                            <li key={txIndex} className="text-xs text-[color:var(--color-text-75)] flex justify-between">
                              <span>• {tx.provider || tx.concept || 'Pago'}</span>
                              <span className="font-semibold">{formatCurrency(tx.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-white border border-[var(--color-primary-50)]">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[color:var(--color-primary)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[color:var(--color-text-75)]">
                    <strong>Recomendación:</strong> Asegúrate de tener fondos suficientes antes de estas fechas
                    o negocia con tus proveedores cambios en las fechas de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Resumen de pagos próximos (sin déficit) */}
      {!alerts.hasAlerts && alerts.upcomingExpenses.length > 0 && (
        <Card className="border-[var(--color-primary)] bg-[var(--color-primary-10)]">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-[color:var(--color-primary)] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-[color:var(--color-text)] mb-2">
                Pagos programados próximos
              </h3>
              <p className="text-sm text-[color:var(--color-text-75)] mb-3">
                Tienes <strong>{alerts.upcomingExpenses.length} pagos</strong> programados en los próximos {daysLookahead} días.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts.upcomingExpenses.slice(0, 5).map((tx, index) => {
                  const daysUntil = getDaysUntil(tx.dueDate);
                  return (
                    <div
                      key={index}
                      className="p-2 rounded bg-white border border-[var(--color-border)] flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[color:var(--color-text)]">
                          {tx.provider || tx.concept || 'Pago'}
                        </p>
                        <p className="text-xs text-[color:var(--color-text-60)]">
                          {formatDate(tx.dueDate)} • {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
                        </p>
                      </div>
                      <p className="font-bold text-[color:var(--color-text)]">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  );
                })}
                {alerts.upcomingExpenses.length > 5 && (
                  <p className="text-xs text-center text-[color:var(--color-text-60)] pt-2">
                    ... y {alerts.upcomingExpenses.length - 5} pagos más
                  </p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[color:var(--color-text)]">
                    Total a pagar:
                  </span>
                  <span className="text-lg font-bold text-[color:var(--color-primary)]">
                    {formatCurrency(
                      alerts.upcomingExpenses.reduce((sum, tx) => sum + (tx.amount || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
