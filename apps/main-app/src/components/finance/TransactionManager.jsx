import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Upload, Download, Search, Filter, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import Modal from '../Modal';
import { Card, Button } from '../ui';
import TransactionForm from './TransactionForm';
import TransactionImportModal from './TransactionImportModal';
import TransactionFilterBar from './TransactionFilterBar';
import VirtualizedTransactionList from './VirtualizedTransactionList';
import { downloadBlob } from '../../utils/downloadUtils';
import { formatCurrency } from '../../utils/formatUtils';

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
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [onlyUncategorized, setOnlyUncategorized] = useState(false);

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

  const openCreate = () => {
    setEditingTransaction(null);
    setPrefillTransaction(null);
    setShowTransactionModal(true);
  };
  
  const openEdit = (transaction) => {
    setEditingTransaction(transaction);
    setPrefillTransaction(transaction);
    setShowTransactionModal(true);
  };
  
  const closeModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
    setPrefillTransaction(null);
  };
  
  const openImport = () => setShowImportModal(true);
  const closeImport = () => setShowImportModal(false);

  // Helper para obtener valor pagado
  const getPaidValue = (tx) => {
    const amount = Number(tx.amount) || 0;
    const rawPaid = Number(tx.paidAmount);
    let paid = Number.isFinite(rawPaid) ? rawPaid : 0;
    if (amount > 0) paid = Math.min(Math.max(paid, 0), amount);
    else paid = Math.max(paid, 0);
    if (tx.type === 'expense' && tx.status === 'paid' && paid === 0) return amount;
    if (tx.type === 'income' && tx.status === 'received' && paid === 0) return amount;
    return paid;
  };

  // Listas únicas para filtros
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    transactions.forEach(tx => tx.category && cats.add(tx.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const uniqueProviders = useMemo(() => {
    const provs = new Set();
    transactions.forEach(tx => tx.provider && provs.add(tx.provider));
    return Array.from(provs).sort();
  }, [transactions]);

  // Filtrado y ordenamiento
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tx => 
        (tx.concept?.toLowerCase() || '').includes(term) ||
        (tx.description?.toLowerCase() || '').includes(term) ||
        (tx.provider?.toLowerCase() || '').includes(term)
      );
    }

    // Tipo
    if (typeFilter) {
      result = result.filter(tx => tx.type === typeFilter);
    }

    // Categoría
    if (categoryFilter) {
      result = result.filter(tx => tx.category === categoryFilter);
    }

    // Proveedor
    if (providerFilter) {
      result = result.filter(tx => tx.provider === providerFilter);
    }

    // Rango de fechas
    if (dateRange) {
      const days = Number(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(tx => {
        const txDate = new Date(tx.date);
        return !isNaN(txDate.getTime()) && txDate >= cutoff;
      });
    }

    // Solo sin categoría
    if (onlyUncategorized) {
      result = result.filter(tx => !tx.category);
    }

    // Ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'date_desc':
          return new Date(b.date) - new Date(a.date);
        case 'amount_asc':
          return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        case 'amount_desc':
          return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return result;
  }, [transactions, searchTerm, typeFilter, categoryFilter, providerFilter, dateRange, sortBy, onlyUncategorized]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const count = filteredTransactions.length;
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingExpenses = 0;
    let overdueExpenses = 0;
    const now = new Date();

    filteredTransactions.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      const paid = getPaidValue(tx);
      
      if (tx.type === 'income') {
        totalIncome += paid;
      } else {
        totalExpense += paid;
        const outstanding = Math.max(0, amount - paid);
        if (outstanding > 0) {
          pendingExpenses += outstanding;
          if (tx.dueDate) {
            const due = new Date(tx.dueDate);
            if (!isNaN(due.getTime()) && due < now && tx.status !== 'paid') {
              overdueExpenses += outstanding;
            }
          }
        }
      }
    });

    return {
      count,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingExpenses,
      overdueExpenses,
    };
  }, [filteredTransactions]);

  const emptyState = (
    <div className="p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-text-5)] mb-4">
        <DollarSign className="w-8 h-8 text-[color:var(--color-text-40)]" />
      </div>
      <p className="text-lg font-medium text-[color:var(--color-text-80)] mb-2">
        {t('finance.transactions.empty', { defaultValue: 'No hay transacciones que mostrar' })}
      </p>
      <p className="text-sm text-[color:var(--color-text-60)] mb-6">
        {t('finance.transactions.emptyHint', { defaultValue: 'Comienza registrando tus primeros ingresos y gastos' })}
      </p>
      <Button
        onClick={openCreate}
        leftIcon={<Plus size={16} />}
        data-testid="transactions-new"
      >
        {t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
      </Button>
    </div>
  );

  const handleDelete = async (tx) => {
    if (!window.confirm(t('finance.transactions.confirmDelete', { defaultValue: '¿Eliminar esta transacción?' }))) return;
    try {
      await onDeleteTransaction?.(tx.id);
      toast.success(t('finance.transactions.deleteSuccess', { defaultValue: 'Transacción eliminada' }));
    } catch (err) {
      toast.error(t('finance.transactions.deleteError', { defaultValue: 'No se pudo eliminar' }));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-[color:var(--color-primary-30)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-primary)] mb-1">
                  {t('finance.transactions.totalTransactions', { defaultValue: 'Total' })}
                </p>
                <p className="text-2xl font-black text-body">{stats.count}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[color:var(--color-primary-40)]" />
            </div>
          </Card>

          <Card className="p-4 border-[color:var(--color-success-30)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)] mb-1">
                  {t('finance.transactions.totalIncome', { defaultValue: 'Ingresos' })}
                </p>
                <p className="text-2xl font-black text-[color:var(--color-success)]">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[color:var(--color-success-40)]" />
            </div>
          </Card>

          <Card className="p-4 border-[color:var(--color-danger-30)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-danger)] mb-1">
                  {t('finance.transactions.totalExpense', { defaultValue: 'Gastos' })}
                </p>
                <p className="text-2xl font-black text-[color:var(--color-danger)]">
                  {formatCurrency(stats.totalExpense)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-[color:var(--color-danger-40)]" />
            </div>
          </Card>

          <Card className="p-4 border-[color:var(--color-warning-30)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)] mb-1">
                  {t('finance.transactions.pending', { defaultValue: 'Pendiente' })}
                </p>
                <p className="text-2xl font-black text-[color:var(--color-warning)]">
                  {formatCurrency(stats.pendingExpenses)}
                </p>
                {stats.overdueExpenses > 0 && (
                  <p className="text-xs text-[color:var(--color-danger)] mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formatCurrency(stats.overdueExpenses)} {t('finance.transactions.overdue', { defaultValue: 'vencido' })}
                  </p>
                )}
              </div>
              <AlertCircle className="w-8 h-8 text-[color:var(--color-warning-40)]" />
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={openCreate}
                leftIcon={<Plus size={16} />}
                data-testid="transactions-new"
              >
                {t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
              </Button>
              <Button
                variant="outline"
                leftIcon={<Upload size={16} />}
                onClick={openImport}
                disabled={importing || isLoading}
              >
                {importing
                  ? t('finance.transactions.importing', { defaultValue: 'Importando…' })
                  : t('finance.transactions.import', { defaultValue: 'Importar' })}
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download size={16} />}
                onClick={async () => {
                  if (!onExportReport) return;
                  try {
                    setExporting(true);
                    const result = await onExportReport();
                    if (result?.success && result.blob) {
                      const fileName = result.fileName || `finanzas-${new Date().toISOString().slice(0, 10)}.xlsx`;
                      downloadBlob(result.blob, fileName);
                      toast.success(t('finance.transactions.exportSuccess', { defaultValue: 'Reporte generado' }));
                    } else {
                      throw new Error(result?.error || 'Exportación fallida');
                    }
                  } catch (err) {
                    toast.error(err?.message || t('finance.transactions.exportError', { defaultValue: 'Error al exportar' }));
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting || isLoading}
              >
                {exporting
                  ? t('finance.transactions.exporting', { defaultValue: 'Exportando…' })
                  : t('finance.transactions.export', { defaultValue: 'Exportar' })}
              </Button>
            </div>
            <Button
              variant="outline"
              leftIcon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {t('finance.transactions.filters', { defaultValue: 'Filtros' })}
            </Button>
          </div>
        </Card>

        {/* Filters */}
        {showFilters && (
          <Card className="p-4">
            <TransactionFilterBar
              t={t}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              providerFilter={providerFilter}
              onProviderChange={setProviderFilter}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onlyUncategorized={onlyUncategorized}
              onOnlyUncategorizedChange={setOnlyUncategorized}
              categories={uniqueCategories}
              providers={uniqueProviders}
            />
          </Card>
        )}

        {/* Transaction List */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">{t('app.loading', { defaultValue: 'Cargando...' })}</div>
          ) : filteredTransactions.length === 0 ? (
            transactions.length === 0 ? emptyState : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-[color:var(--color-text-40)] mx-auto mb-3" />
                <p className="text-[color:var(--color-text-60)]">
                  {t('finance.transactions.noResults', { defaultValue: 'No se encontraron transacciones con estos filtros' })}
                </p>
              </div>
            )
          ) : (
            <VirtualizedTransactionList
              items={filteredTransactions}
              getPaidValue={getPaidValue}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </Card>
      </div>

      <Modal
        open={showTransactionModal}
        onClose={closeModal}
        title={editingTransaction 
          ? t('finance.transactions.edit', { defaultValue: 'Editar transacción' })
          : t('finance.transactions.new', { defaultValue: 'Nueva transacción' })}
        data-testid="finance-transaction-modal"
      >
        <TransactionForm
          transaction={prefillTransaction || undefined}
          isLoading={isLoading}
          onCancel={closeModal}
          onSave={async (data) => {
            try {
              if (editingTransaction) {
                const res = await onUpdateTransaction?.(editingTransaction.id, data);
                if (!res || res.success) {
                  toast.success(t('finance.transactions.updateSuccess', { defaultValue: 'Transacción actualizada' }));
                  closeModal();
                }
              } else {
                const res = await onCreateTransaction?.(data);
                if (!res || res.success) {
                  toast.success(t('finance.transactions.createSuccess', { defaultValue: 'Transacción creada' }));
                  closeModal();
                }
              }
            } catch (err) {
              toast.error(err?.message || t('finance.transactions.saveError', { defaultValue: 'Error al guardar' }));
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
                defaultValue: 'Importación no disponible',
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
                  defaultValue: 'Importación completada',
                }) +
                  (result?.imported
                    ? ` (${result.imported} ${
                        result.imported === 1
                          ? t('finance.transactions.item', { defaultValue: 'transacción' })
                          : t('finance.transactions.items', { defaultValue: 'transacciones' })
                      })`
                    : '')
              );
            } else if (result?.errors?.length) {
              toast.warning(
                `${t('finance.transactions.importPartial', {
                  defaultValue: 'Importación parcial',
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
