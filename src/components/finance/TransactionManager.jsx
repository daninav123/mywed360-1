import { Plus } from 'lucide-react';
import React from 'react';

import useTranslations from '../../hooks/useTranslations';
import { Card, Button } from '../ui';

// Minimal, safe placeholder implementation to avoid build errors while finance module is repaired
export default function TransactionManager({
  transactions = [],
  onCreateTransaction,
  isLoading,
}) {
  const { t } = useTranslations();

  return (
    <Card className="overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md border-soft p-4">
      {isLoading ? (
        <div className="p-8 text-center">{t('app.loading', { defaultValue: 'Cargando...' })}</div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[color:var(--color-text)]/60">
            {t('finance.transactions.empty', {
              defaultValue: 'No hay transacciones que mostrar',
            })}
          </p>
          {onCreateTransaction && (
            <Button className="mt-4" onClick={() => onCreateTransaction()} leftIcon={<Plus size={16} />}>
              {t('finance.transactions.createFirst', { defaultValue: 'Crear primera transacción' })}
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 text-sm text-[color:var(--color-text)]/70">
          {t('app.success', { defaultValue: 'Éxito' })}: {transactions.length} {t('finance.transactions.headers.actions', { defaultValue: 'registros' })}
        </div>
      )}
    </Card>
  );
}

