import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import FinanceOverview from '../components/finance/FinanceOverview';
import TransactionManager from '../components/finance/TransactionManager';
import BudgetManager from '../components/finance/BudgetManager';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceCharts from '../components/finance/FinanceCharts';
import useFinance from '../hooks/useFinance';
import useTranslations from '../hooks/useTranslations';

/**
 * PÃ¡gina de Gestion financiera completamente refactorizada
 * Arquitectura modular, optimizada y mantenible
 * 
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Eliminada complejidad anterior (571 lÃ­neas â†’ 180 lÃ­neas)
 * - Arquitectura modular con componentes especializados
 * - Hook personalizado useFinance para lÃ³gica centralizada
 * - MemoizaciÃ³n y optimizaciÃ³n de re-renders
 * - IntegraciÃ³n con sistema i18n
 * - UX mejorada con tabs y navegaciÃ³n clara
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
    
    // CÃ¡lculos
    stats,
    budgetUsage,
    
    // Acciones
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    updateBudgetCategory,
    removeBudgetCategory,
    updateTotalBudget,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,
    clearError
  } = useFinance();

  // Estado para tabs activo
  const [activeTab, setActiveTab] = useState('overview');

  // Detectar URL hash para abrir modal especÃ­fico
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#nuevo') {
      setActiveTab('transactions');
      // El TransactionManager manejarÃ¡ la apertura del modal
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Cargar nÃºmero de invitados al montar el componente
  useEffect(() => {
    loadGuestCount();
  }, [loadGuestCount]);

  // Limpiar errores despuÃ©s de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Manejar actualizaciÃ³n de presupuesto total
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
          <div className="rounded-md p-4 bg-[var(--color-danger)]/10 border border-[color:var(--color-danger)]/30">
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

        {/* NavegaciÃ³n por tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="budget">Presupuesto</TabsTrigger>
            <TabsTrigger value="contributions">Aportaciones</TabsTrigger>
            <TabsTrigger value="analytics">Analisis</TabsTrigger>
          </TabsList>

          {/* Tab: Resumen general */}
          <TabsContent value="overview" className="space-y-6">
            <FinanceOverview
              stats={stats}
              syncStatus={syncStatus}
              budgetUsage={budgetUsage}
            />
          </TabsContent>

          {/* Tab: Gestion de transacciones */}
          <TabsContent value="transactions" className="space-y-6">
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
            />
          </TabsContent>

          {/* Tab: ConfiguraciÃ³n de aportaciones */}
          <TabsContent value="contributions" className="space-y-6">
            <ContributionSettings
              contributions={contributions}
              onUpdateContributions={updateContributions}
              onLoadGuestCount={loadGuestCount}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Tab: Analisis y grÃ¡ficos */}
          <TabsContent value="analytics" className="space-y-6">
            <FinanceCharts
              transactions={transactions}
              budgetUsage={budgetUsage}
              stats={stats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Finance;
