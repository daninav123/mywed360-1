import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';
import { Card, Button } from '../ui';
import Modal from '../Modal';
import TransactionForm from './TransactionForm';
import FinanceStatsHeader from './FinanceStatsHeader';

// ImplementaciÃ³n mÃ­nima pero funcional para gestionar la primera creaciÃ³n
export default function TransactionManager({
  transactions = [],
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onImportBank,
  isLoading,
}) {
  const { t } = useTranslations();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const openCreate = () => setShowTransactionModal(true);
  const closeModal = () => setShowTransactionModal(false);

  const emptyState = (
    <div className="p-8 text-center">
      <p className="text-[color:var(--color-text)]/60">
        {t('finance.transactions.empty', { defaultValue: 'No hay transacciones que mostrar' })}
      </p>
      <Button className="mt-4" onClick={openCreate} leftIcon={<Plus size={16} />}>
        {t('finance.transactions.createFirst', { defaultValue: 'Crear primera transacción' })}
      </Button>
    </div>
  );

  const stats = (() => {
    const count = Array.isArray(transactions) ? transactions.length : 0;
    let balance = 0;
    if (count > 0) {
      for (const tx of transactions) {
        const amt = Number(tx?.paidAmount ?? tx?.amount ?? 0) || 0;
        if ((tx?.type || 'expense') === 'income') balance += Math.max(0, amt);
        else balance -= Math.max(0, amt);
      }
    }
    return { count, balance, pendingExpenses: 0, overdueExpenses: 0 };
  })();

  return (
    <>
      <Card className="overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md border-soft p-4">
        {isLoading ? (
          <div className="p-8 text-center">{t('app.loading', { defaultValue: 'Cargando...' })}</div>
        ) : transactions.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4">
            <FinanceStatsHeader
              t={t}
              stats={stats}
              isLoading={isLoading}
              csvLoading={false}
              onConnectBank={() => {}}
              onImportCSV={() => {}}
              onExportCSV={() => {}}
              onNew={openCreate}
            />
          </div>
        )}
      </Card>

      <Modal
        open={showTransactionModal}
        onClose={closeModal}
        title={t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
      >
        <TransactionForm
          isLoading={isLoading}
          onCancel={closeModal}
          onSave={async (data) => {
            try {
              const res = await onCreateTransaction?.(data);
              if (!res || res.success) closeModal();
            } catch {
              // error manejado por capa superior (toasts)
            }
          }}
        />
      </Modal>
    </>
  );
}
