import { Plus, Download, Upload } from 'lucide-react';
import React from 'react';

import { formatCurrency } from '../../utils/formatUtils';
import { Button } from '../ui';

export default function FinanceStatsHeader({
  t,
  stats,
  isLoading,
  csvLoading,
  onConnectBank,
  onImportCSV,
  onExportCSV,
  onNew,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
          {t('finance.transactions.title', { defaultValue: 'Transacciones' })}
        </h2>
        <p className="text-sm text-[color:var(--color-text)]/70">
          {stats.count} {t('finance.transactions.items', { defaultValue: 'transacciones' })}
          {' - '} {t('finance.transactions.balanceLabel', { defaultValue: 'Balance:' })}{' '}
          {formatCurrency(stats.balance)}
          {stats.pendingExpenses > 0 && (
            <span>
              {' - '}
              {t('finance.transactions.pendingAmount', { defaultValue: 'Pendiente:' })}{' '}
              {formatCurrency(stats.pendingExpenses)}
            </span>
          )}
          {stats.overdueExpenses > 0 && (
            <span className="text-[color:var(--color-danger)]">
              {' - '}
              {t('finance.transactions.overdueAmount', { defaultValue: 'Vencido:' })}{' '}
              {formatCurrency(stats.overdueExpenses)}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          leftIcon={<Upload size={16} />}
          onClick={onConnectBank}
          disabled={isLoading}
        >
          {t('finance.transactions.connectBank', { defaultValue: 'Conectar Banco (Nordigen)' })}
        </Button>
        <Button
          variant="outline"
          leftIcon={<Upload size={16} />}
          onClick={(e) => {
            e.preventDefault();
            onImportCSV?.();
          }}
          disabled
          title={t('finance.transactions.importComingSoon', { defaultValue: 'Importación CSV disponible próximamente' })}
        >
          {t('finance.transactions.importCSV', { defaultValue: 'Importar CSV' })}
        </Button>
        <Button
          variant="outline"
          leftIcon={<Download size={16} />}
          onClick={(e) => {
            e.preventDefault();
            onExportCSV?.();
          }}
          disabled
          title={t('finance.transactions.exportComingSoon', { defaultValue: 'Exportación CSV disponible próximamente' })}
        >
          {t('finance.transactions.exportCSV', { defaultValue: 'Exportar CSV' })}
        </Button>
        <Button leftIcon={<Plus size={16} />} onClick={onNew}>
          {t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
        </Button>
      </div>
    </div>
  );
}
