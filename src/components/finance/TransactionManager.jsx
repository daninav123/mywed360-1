import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import Modal from '../Modal';
import { Card, Button } from '../ui';
import FinanceStatsHeader from './FinanceStatsHeader';
import TransactionForm from './TransactionForm';
import TransactionImportModal from './TransactionImportModal';
import { downloadBlob } from '../../utils/downloadUtils';

export default function TransactionManager({
  transactions = [],
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onImportBank,
  onImportTransactions,
  onExportReport,
  isLoading,
  initialTransaction,
  onInitialOpened,
}) {
  const { t } = useTranslations();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [prefillTransaction, setPrefillTransaction] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Abrir modal automáticamente si hay pre-relleno en history.state
  useEffect(() => {
    try {
      const st = (window.history && window.history.state) || null;
      const pre = st && st.prefillTransaction ? st.prefillTransaction : null;
      if (pre) {
        setPrefillTransaction(pre);
        setShowTransactionModal(true);
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname + window.location.search + window.location.hash);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (initialTransaction) {
      setPrefillTransaction(initialTransaction);
      setShowTransactionModal(true);
      onInitialOpened?.();
    }
  }, [initialTransaction, onInitialOpened]);

  const openCreate = () => setShowTransactionModal(true);
  const closeModal = () => setShowTransactionModal(false);
  const openImport = () => setShowImportModal(true);
  const closeImport = () => setShowImportModal(false);

  const emptyState = (
    <div className="p-8 text-center">
      <p className="text-[color:var(--color-text)]/60">
        {t('finance.transactions.empty', { defaultValue: 'No hay transacciones que mostrar' })}
      </p>
      <Button
        className="mt-4"
        onClick={openCreate}
        leftIcon={<Plus size={16} />}
        data-testid="transactions-new"
      >
        {t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
      </Button>
    </div>
  );

  const stats = (() => {
    const count = Array.isArray(transactions) ? transactions.length : 0;
    let balance = 0;
    for (const tx of Array.isArray(transactions) ? transactions : []) {
      const amt = Number(tx?.paidAmount ?? tx?.amount ?? 0) || 0;
      if ((tx?.type || 'expense') === 'income') balance += Math.max(0, amt);
      else balance -= Math.max(0, amt);
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
              importLoading={importing}
              exportLoading={exporting}
              onConnectBank={() => onImportBank?.()}
              onImportCSV={openImport}
              onExportCSV={async () => {
                if (!onExportReport) return;
                try {
                  setExporting(true);
                  const result = await onExportReport();
                  if (result?.success && result.blob) {
                    const fileName =
                      result.fileName ||
                      `finanzas-${new Date().toISOString().slice(0, 10)}.xlsx`;
                    downloadBlob(result.blob, fileName);
                    toast.success(
                      t('finance.transactions.exportSuccess', {
                        defaultValue: 'Reporte financiero generado correctamente',
                      })
                    );
                  } else {
                    throw new Error(result?.error || {t('common.exportacion_fallida')});
                  }
                } catch (err) {
                  toast.error(
                    err?.message ||
                      t('finance.transactions.exportError', {
                        defaultValue: 'No se pudo generar el reporte',
                      })
                  );
                } finally {
                  setExporting(false);
                }
              }}
              onNew={openCreate}
            />
          </div>
        )}
      </Card>

      <Modal
        open={showTransactionModal}
        onClose={closeModal}
        title={t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
        data-testid="finance-transaction-modal"
      >
        <TransactionForm
          transaction={prefillTransaction || undefined}
          isLoading={isLoading}
          onCancel={closeModal}
          onSave={async (data) => {
            try {
              const res = await onCreateTransaction?.(data);
              if (!res || res.success) closeModal();
            } catch {
              // manejado por capa superior (toasts)
            }
          }}
        />
      </Modal>

      <TransactionImportModal
        open={showImportModal}
        onClose={closeImport}
        isLoading={importing || isLoading}
        onImport={async (parsedRows) => {
          if (!onImportTransactions) {
            toast.error(
              t('finance.transactions.importUnsupported', {
                defaultValue: t('common.importacion_disponible'),
              })
            );
            return { success: false, error: 'Import unsupported' };
          }
          try {
            setImporting(true);
            const result = await onImportTransactions(parsedRows);
            if (result?.success) {
              toast.success(
                t('finance.transactions.importSuccess', {
                  defaultValue: t('common.importacion_completada'),
                }) +
                  (result?.imported
                    ? ` (${result.imported} ${
                        result.imported === 1
                          ? t('finance.transactions.item', { defaultValue: t('common.transaccion') })
                          : t('finance.transactions.items', { defaultValue: 'transacciones' })
                      })`
                    : '')
              );
            } else if (result?.errors?.length) {
              toast.warning(
                `${t('finance.transactions.importPartial', {
                  defaultValue: t('common.importacion_parcial'),
                })}: ${result.errors.length} ${t('finance.transactions.rowsFailed', {
                  defaultValue: 'filas con errores',
                })}`
              );
            } else {
              toast.error(
                result?.error ||
                  t('finance.transactions.importError', {
                    defaultValue: 'No se pudo importar el archivo',
                  })
              );
            }
            return result;
          } finally {
            setImporting(false);
          }
        }}
      />
    </>
  );
}
