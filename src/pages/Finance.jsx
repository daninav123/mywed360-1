import React, { useState, useEffect } from 'react';

import BudgetManager from '../components/finance/BudgetManager';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceOverview from '../components/finance/FinanceOverview';
import TransactionManager from '../components/finance/TransactionManager';
import PageWrapper from '../components/PageWrapper';
import PageTabs from '../components/ui/PageTabs';

// Lazy load analytics charts to reduce initial bundle
const FinanceCharts = React.lazy(() => import('../components/finance/FinanceCharts'));
import useFinance from '../hooks/useFinance';
import useTranslations from '../hooks/useTranslations';

function Finance() {
  const { t } = useTranslations();

  // Hook personalizado para Gestión financiera
  const {
    // Estados
    syncStatus,
    isLoading,
    error,
    contributions,
    budget,
    transactions,

    // Cálculos
    stats,
    budgetUsage,
    settings,
    hasBankAccount,

    // Acciones
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    updateBudgetCategory,
    removeBudgetCategory,
    updateTotalBudget,
    updateBudgetSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,
    clearError,
  } = useFinance();

  // Estado para tabs activo
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionFiltersSignal, setTransactionFiltersSignal] = useState(null);

  // Detectar URL hash para abrir modal específico
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#nuevo') {
      setActiveTab('transactions');
      // El TransactionManager Gestionará la apertura del modal
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Cargar número de invitados al montar el componente
  useEffect(() => {
    loadGuestCount();
  }, [loadGuestCount]);

  // Limpiar errores después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const navigateToTransactions = ({ tab = 'transactions', filters = {} } = {}) => {
    if (tab) setActiveTab(tab);
    setTransactionFiltersSignal({ version: Date.now(), filters });
  };

  // Manejar actualización de presupuesto total
  const handleUpdateTotalBudget = (newTotal) => {
    if (typeof newTotal === 'string') newTotal = Number(newTotal);
    if (Number.isNaN(newTotal) || newTotal < 0) return;
    updateTotalBudget(newTotal);
  };

  return (
    <PageWrapper
      title={t('navigation.finance', { defaultValue: 'Finanzas' })}
      className="max-w-7xl mx-auto"
    >
      <div className="space-y-6">
        {/* Mostrar errores si existen */}
        {error && (
          <div
            className="rounded-md p-4 bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30"
            aria-live="polite"
          >
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[color:var(--color-danger)]">
                  Error en Gestión financiera
                </h3>
                <div className="mt-2 text-sm text-[color:var(--color-danger)]/90">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de página (estilo Proveedores) */}
        <PageTabs
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { id: 'overview', label: t('finance.tabs.overview', { defaultValue: 'Resumen' }) },
            {
              id: 'transactions',
              label: t('finance.tabs.transactions', { defaultValue: 'Transacciones' }),
            },
            { id: 'budget', label: t('finance.tabs.budget', { defaultValue: 'Presupuesto' }) },
            {
              id: 'contributions',
              label: t('finance.tabs.contributions', { defaultValue: 'Aportaciones' }),
            },
            { id: 'analytics', label: t('finance.tabs.analytics', { defaultValue: 'Análisis' }) },
          ]}
          className="w-full"
        />

        {/* Contenido: Resumen */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <FinanceOverview
              stats={stats}
              syncStatus={syncStatus}
              budgetUsage={budgetUsage}
              thresholds={settings?.alertThresholds}
              isLoading={isLoading}
              transactions={transactions}
            />
          </div>
        )}

        {/* Contenido: Transacciones */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {!hasBankAccount && (
              <div className="p-4 border rounded-md border-[color:var(--color-primary)]/30 bg-[var(--color-primary)]/10">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-[var(--color-primary)]">
                      {t('finance.connectBank.title', {
                        defaultValue: 'Conecta tu banco para importar movimientos',
                      })}
                    </p>
                    <p className="text-sm text-[color:var(--color-text)]/70">
                      {t('finance.connectBank.desc', {
                        defaultValue:
                          'Acelera el registro de gastos e ingresos conectando tu cuenta bancaria.',
                      })}
                    </p>
                  </div>
                  <a
                    href="/finance/bank-connect"
                    className="inline-flex items-center px-3 py-2 rounded-md bg-[var(--color-primary)] text-white hover:brightness-110"
                  >
                    {t('finance.connectBank.button', { defaultValue: 'Conectar banco' })}
                  </a>
                </div>
              </div>
            )}
            <TransactionManager
              transactions={transactions}
              onCreateTransaction={createTransaction}
              onUpdateTransaction={updateTransaction}
              onDeleteTransaction={deleteTransaction}
              onImportBank={importBankTransactions}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Contenido: Presupuesto */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <BudgetManager
              budget={budget}
              budgetUsage={budgetUsage}
              onUpdateBudget={handleUpdateTotalBudget}
              onAddCategory={addBudgetCategory}
              onUpdateCategory={updateBudgetCategory}
              onRemoveCategory={removeBudgetCategory}
              alertThresholds={settings?.alertThresholds}
              onUpdateSettings={(s) => updateBudgetSettings({ alertThresholds: s })}
            />
          </div>
        )}

        {/* Contenido: Aportaciones */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <ContributionSettings
              contributions={contributions}
              onUpdateContributions={updateContributions}
              onLoadGuestCount={loadGuestCount}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Contenido: Análisis */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <React.Suspense fallback={<div className="p-4">Cargando análisis…</div>}>
              <FinanceCharts transactions={transactions} budgetUsage={budgetUsage} stats={stats} />
            </React.Suspense>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default Finance;
