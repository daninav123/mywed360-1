import React, { useState, useEffect } from 'react';

import BudgetManager from '../components/finance/BudgetManager';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceOverview from '../components/finance/FinanceOverview';
import FinanceCashflowTimeline from '../components/finance/FinanceCashflowTimeline';
import PaymentSuggestions from '../components/finance/PaymentSuggestions.jsx';
import TransactionManager from '../components/finance/TransactionManager';
import PageWrapper from '../components/PageWrapper';
import PageTabs from '../components/ui/PageTabs';

// Lazy load analytics charts to reduce initial bundle
const FinanceCharts = React.lazy(() => import('../components/finance/FinanceCharts'));
import useFinance from '../hooks/useFinance';
import useProveedores from '../hooks/useProveedores';
import useTranslations from '../hooks/useTranslations';
import useBudgetBenchmarks from '../hooks/useBudgetBenchmarks';
import { useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import TransactionForm from '../components/finance/TransactionForm';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';

function Finance() {
  const { t } = useTranslations();
  const { providers: supplierProviders = [] } = useProveedores();
  const location = useLocation();
  const [prefillTx, setPrefillTx] = useState(null);
  useEffect(() => {
    try {
      const st = (location && location.state) || (window.history && window.history.state && window.history.state.usr) || null;
      const pre = st && st.prefillTransaction ? st.prefillTransaction : null;
      if (pre) {
        setActiveTab('transactions');
        setPrefillTx(pre);
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname + window.location.search + window.location.hash);
        }
      }
    } catch {}
  }, [location]);

  // Hook personalizado para Gestión financiera
  const {
    // Estados
    isLoading,
    error,
    contributions,
    budget,
    advisor,
    advisorLoading,
    advisorError,
    transactions,
    activeWedding,
    activeWeddingData,

    // Cálculos
    stats,
    budgetUsage,
    settings,
    hasBankAccount,
    projection,
    predictiveInsights,
    monthlySeries,

    // Acciones
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    setBudgetCategories,
    updateBudgetCategory,
    removeBudgetCategory,
    requestBudgetAdvisor,
    applyAdvisorScenario,
    refreshBudgetAdvisor,
    updateTotalBudget,
    updateBudgetSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,
    importTransactionsBulk,
    exportFinanceReport,
    captureBudgetSnapshot,
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

  const benchmarkData = useBudgetBenchmarks({
    country: activeWeddingData?.countryCode || activeWeddingData?.country,
    region: activeWeddingData?.province || activeWeddingData?.state || activeWeddingData?.city,
    guestCount: contributions?.guestCount || activeWeddingData?.guestCount,
    enabled: Boolean(activeWedding),
  });

  const handleApplyBenchmark = (strategy = 'p50') => {
    if (!benchmarkData || typeof benchmarkData.applySuggestion !== 'function') return;
    const suggestions = benchmarkData.applySuggestion(strategy).filter((entry) => entry.amount > 0);
    if (!suggestions.length) return;

    const existing = Array.isArray(budget?.categories) ? [...budget.categories] : [];
    const map = new Map(
      existing.map((cat) => [normalizeBudgetCategoryKey(cat?.name || ''), { ...cat }])
    );

    suggestions.forEach((suggestion) => {
      const key = normalizeBudgetCategoryKey(suggestion.key);
      if (!key || suggestion.amount <= 0) return;
      const current = map.get(key);
      if (current) {
        if (!Number(current.amount)) {
          current.amount = suggestion.amount;
        }
      } else {
        const label = suggestion.key
          .split('-')
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' ');
        map.set(key, {
          name: label,
          amount: suggestion.amount,
          muted: false,
        });
      }
    });

    const nextCategories = Array.from(map.values());
    setBudgetCategories(nextCategories);
  };

  const handleCaptureSnapshot = async () => {
    const result = await captureBudgetSnapshot({ status: 'confirmed', source: 'manual' });
    if (!result?.success && result?.error) {
      console.warn('[Finance] captureBudgetSnapshot failed', result.error);
    }
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
                  {t("finance.error.title", { defaultValue: "Error en Gestión financiera" })}
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
            { id: 'analytics', label: t('finance.tabs.analytics', { defaultValue: t('common.analisis') }) },
          ]}
          className="w-full"
        />

        {/* Contenido: Resumen */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <FinanceOverview
              stats={stats}
              budgetUsage={budgetUsage}
              thresholds={settings?.alertThresholds}
              isLoading={isLoading}
              transactions={transactions}
              projection={projection}
              predictiveInsights={predictiveInsights}
            />
            <FinanceCashflowTimeline
              monthlySeries={monthlySeries}
              predictiveInsights={predictiveInsights}
              stats={stats}
              budget={budget}
            />
          </div>
        )}

        {/* Contenido: Transacciones */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <PaymentSuggestions
              onCreateTransaction={createTransaction}
              isLoading={isLoading}
              providers={supplierProviders}
              enabled={!hasBankAccount}
              disabledMessage="Con la cuenta bancaria vinculada importamos los movimientos directamente, por lo que las sugerencias del correo quedan desactivadas."
            />
            {/* Vista rápida: transacciones registradas desde emails */}
            <div className="p-3 border rounded bg-white/60">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Transacciones registradas desde emails</h3>
                <span className="text-xs text-gray-600">{(transactions || []).filter(tx => /Desde email:/i.test(tx?.description || '') || (tx?.meta && tx.meta.source === 'email')).length}</span>
              </div>
              <div className="max-h-40 overflow-auto text-sm">
                {(transactions || [])
                  .filter((tx) => /Desde email:/i.test(tx?.description || '') || (tx?.meta && tx.meta.source === 'email'))
                  .slice(0, 8)
                  .map((tx, i) => (
                    <div key={tx.id || i} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div className="truncate">
                        <div className="font-medium truncate" title={tx.concept || ''}>{tx.concept || '(Sin concepto)'}</div>
                        <div className="text-[color:var(--color-text)]/70">{(tx.date || '').slice(0,10)} · {tx.type === 'income' ? 'Ingreso' : 'Gasto'} · {tx.provider || ''}</div>
                      </div>
                      <div className="whitespace-nowrap">{Number(tx.amount || tx.paidAmount || 0).toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            </div>
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
              onImportTransactions={importTransactionsBulk}
              onExportReport={exportFinanceReport}
              isLoading={isLoading}
              initialTransaction={prefillTx}
              onInitialOpened={() => setPrefillTx(null)}
            />
          </div>
        )}

        {/* Contenido: Presupuesto */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <BudgetManager
              budget={budget}
              budgetUsage={budgetUsage}
              stats={stats}
              benchmarks={benchmarkData}
              guestCount={contributions?.guestCount || activeWeddingData?.guestCount || 0}
              onApplyBenchmark={handleApplyBenchmark}
              onCaptureSnapshot={handleCaptureSnapshot}
              onUpdateBudget={handleUpdateTotalBudget}
              onAddCategory={addBudgetCategory}
              onReallocateCategories={setBudgetCategories}
              onUpdateCategory={updateBudgetCategory}
              onRemoveCategory={removeBudgetCategory}
              alertThresholds={settings?.alertThresholds}
              onUpdateSettings={(s) => updateBudgetSettings({ alertThresholds: s })}
              advisor={advisor}
              advisorLoading={advisorLoading}
              advisorError={advisorError}
              onRequestAdvisor={requestBudgetAdvisor}
              onApplyAdvisorScenario={applyAdvisorScenario}
              onRefreshAdvisor={refreshBudgetAdvisor}
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
            <React.Suspense fallback={<div className="p-4">{t("finance.charts.loading", { defaultValue: "Cargando análisis" })}</div>}>
              <FinanceCharts transactions={transactions} budgetUsage={budgetUsage} stats={stats} />
            </React.Suspense>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default Finance;
