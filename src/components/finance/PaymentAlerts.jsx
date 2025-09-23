import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Card } from '../ui';

export default function PaymentAlerts({ overdueCount = 0, upcomingCount = 0, tr = (k) => k }) {
  if (!overdueCount && !upcomingCount) return null;
  return (
    <Card className="p-4 border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--color-text)]">
            {tr('finance.transactions.alerts.title', { defaultValue: 'Pagos importantes' })}
          </p>
          {overdueCount > 0 && (
            <p className="text-sm text-[color:var(--color-danger)]">
              {tr('finance.transactions.alerts.overdue', { defaultValue: 'Pagos vencidos:' })}{' '}
              {overdueCount}
            </p>
          )}
          {upcomingCount > 0 && (
            <p className="text-sm text-[color:var(--color-warning)]">
              {tr('finance.transactions.alerts.upcoming', {
                defaultValue: 'Pagos proximos (7 dias):',
              })}{' '}
              {upcomingCount}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
