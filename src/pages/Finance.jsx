import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import FinanceOverview from '../components/finance/FinanceOverview';
import TransactionManager from '../components/finance/TransactionManager';
import BudgetManager from '../components/finance/BudgetManager';
import ContributionSettings from '../components/finance/ContributionSettings';
// Lazy load analytics charts to reduce initial bundle
const FinanceCharts = React.lazy(() => import('../components/finance/FinanceCharts'));
import useFinance from '../hooks/useFinance';
import useTranslations from '../hooks/useTranslations';

/**
 * Página de Gestion financiera completamente refactorizada
 * Arquitectura modular, optimizada y mantenible
 * 
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Eliminada complejidad anterior (571 líneas â†’ 180 líneas)
 * - Arquitectura modular con componentes especializados
 * - Hook personalizado useFinance para lógica centralizada
 * - Memoización y optimización de re-renders
 * - Integración con sistema i18n
 * - UX mejorada con tabs y navegación clara
 */
function Finance() {
  const { t } = useTranslations();
  
  // Hook personalizado para Gestion financiera
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
    clearError
  } = useFinance();

  // Estado para tabs activo
  const [activeTab, setActiveTab] = useState('overview');

  // Detectar URL hash para abrir modal específico
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#nuevo') {
      setActiveTab('transactions');
      // El TransactionManager manejará la apertura del modal
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

  // Manejar actualización de presupuesto total
  const handleUpdateTotalBudget = (newTotal) => {
    if (typeof newTotal === 'string') newTotal = Number(newTotal);
    if (Number.isNaN(newTotal) || newTotal < 0) return;
    updateTotalBudget(newTotal);
  };

  return (
    <div className="bg-[var(--color-bg)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mostrar errores si existen */}
        {error && (
          <div className="rounded-md p-4 bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30" aria-live="polite">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[color:var(--color-danger)]">
                  Error en Gestion financiera
                </h3>
                <div className="mt-2 text-sm text-[color:var(--color-danger)]/90">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación por tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('finance.tabs.overview', { defaultValue: 'Resumen' })}</TabsTrigger>
            <TabsTrigger value="transactions">{t('finance.tabs.transactions', { defaultValue: 'Transacciones' })}</TabsTrigger>
            <TabsTrigger value="budget">{t('finance.tabs.budget', { defaultValue: 'Presupuesto' })}</TabsTrigger>
            <TabsTrigger value="contributions">{t('finance.tabs.contributions', { defaultValue: 'Aportaciones' })}</TabsTrigger>
            <TabsTrigger value="analytics">{t('finance.tabs.analytics', { defaultValue: 'Análisis' })}</TabsTrigger>
          </TabsList>

          {/* Tab: Resumen general */}
          <TabsContent value="overview" className="space-y-6">
            <FinanceOverview
              stats={stats}
              syncStatus={syncStatus}
              budgetUsage={budgetUsage}
              thresholds={settings?.alertThresholds}
            />
          </TabsContent>

          {/* Tab: Gestion de transacciones */}
          <TabsContent value="transactions" className="space-y-6">
            {!hasBankAccount && (
              <div className="p-4 border rounded-md border-[color:var(--color-primary)]/30 bg-[var(--color-primary)]/10">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-[var(--color-primary)]">{t('finance.connectBank.title', { defaultValue: 'Conecta tu banco para importar movimientos' })}</p>
                    <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.connectBank.desc', { defaultValue: 'Acelera el registro de gastos e ingresos conectando tu cuenta bancaria.' })}</p>
                  </div>
                  <a href="/finance/bank-connect" className="inline-flex items-center px-3 py-2 rounded-md bg-[var(--color-primary)] text-white hover:brightness-110">{t('finance.connectBank.button', { defaultValue: 'Conectar banco' })}</a>
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
          </TabsContent>

          {/* Tab: Gestion de presupuesto */}
          <TabsContent value="budget" className="space-y-6">
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
          </TabsContent>

          {/* Tab: Configuración de aportaciones */}
          <TabsContent value="contributions" className="space-y-6">
            <ContributionSettings
              contributions={contributions}
              onUpdateContributions={updateContributions}
              onLoadGuestCount={loadGuestCount}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Tab: Analisis y gráficos */}
          <TabsContent value="analytics" className="space-y-6">
            <React.Suspense fallback={<div className="p-4">Cargando análisis…</div>}>
              <FinanceCharts
                transactions={transactions}
                budgetUsage={budgetUsage}
                stats={stats}
              />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Finance;
