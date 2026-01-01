import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BudgetManager from '../components/finance/BudgetManager';
import BudgetWizardModal from '../components/finance/BudgetWizardModal';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceOverview from '../components/finance/FinanceOverview';
import FinanceCashflowTimeline from '../components/finance/FinanceCashflowTimeline';
import PaymentSuggestions from '../components/finance/PaymentSuggestions.jsx';
import TransactionManager from '../components/finance/TransactionManager';
import PageTabs from '../components/ui/PageTabs';

// Lazy load analytics charts to reduce initial bundle
const FinanceCharts = React.lazy(() => import('../components/finance/FinanceCharts'));
import useFinance from '../hooks/useFinance';
import useProveedores from '../hooks/useProveedores';
import useTranslations from '../hooks/useTranslations';
import useBudgetBenchmarks from '../hooks/useBudgetBenchmarks';
import useProviderMigration from '../hooks/useProviderMigration';
import { useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import TransactionForm from '../components/finance/TransactionForm';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';
import Card from '../components/ui/Card';
function Finance() {
  const { t } = useTranslations();
  const { providers: supplierProviders = [] } = useProveedores();
  const location = useLocation();
  
  useProviderMigration();
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
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);

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

  // Detectar si debe mostrarse el wizard automáticamente
  useEffect(() => {
    if (!isLoading && !wizardCompleted) {
      const hasCategories = Array.isArray(budget?.categories) && budget.categories.length > 0;
      const hasBudget = budget?.total > 0;
      
      if (!hasCategories && !hasBudget) {
        const timer = setTimeout(() => {
          setShowWizard(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, budget, wizardCompleted]);

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

  const providerCommittedByCategory = useMemo(() => {
    const map = new Map();
    
    (supplierProviders || []).forEach((provider) => {
      if (Array.isArray(provider.serviceLines) && provider.serviceLines.length > 0) {
        provider.serviceLines.forEach((line) => {
          const categoryKey = line.categoryKey || normalizeBudgetCategoryKey(line.name || '');
          if (categoryKey) {
            const currentAmount = map.get(categoryKey) || 0;
            const lineAmount = Number(line.assignedBudget) || 0;
            map.set(categoryKey, currentAmount + lineAmount);
          }
        });
      } else {
        const legacyKey = normalizeBudgetCategoryKey(
          provider?.service || provider?.servicio || provider?.category || provider?.categoria || ''
        );
        if (legacyKey) {
          const currentAmount = map.get(legacyKey) || 0;
          const providerAmount = Number(provider?.assignedBudget || provider?.presupuestoAsignado || 0);
          map.set(legacyKey, currentAmount + providerAmount);
        }
      }
    });
    return map;
  }, [supplierProviders]);

  const handleCompleteWizard = async (wizardData) => {
    try {
      console.log('[Wizard] Datos recibidos:', wizardData);
      
      if (wizardData.totalBudget > 0) {
        updateTotalBudget(wizardData.totalBudget);
      }

      if (wizardData.guestCount > 0) {
        updateContributions({
          ...contributions,
          guestCount: wizardData.guestCount,
        });
      }

      if (Array.isArray(wizardData.distribution) && wizardData.distribution.length > 0) {
        console.log('[Wizard] Distribución:', wizardData.distribution);
        const categories = wizardData.distribution.map(item => ({
          name: item.name,
          amount: item.amount || 0,
          muted: false,
        }));
        console.log('[Wizard] Categorías creadas:', categories);
        setBudgetCategories(categories);
      }

      setWizardCompleted(true);
      setActiveTab('budget');
    } catch (error) {
      console.error('Error completing wizard:', error);
    }
  };

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
      // console.warn('[Finance] captureBudgetSnapshot failed', result.error);
    }
  };

  return (
    <div className="layout-container-wide py-6">
      {/* Header de página con card blanco */}
      <Card className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-body">
          {t('navigation.finance', { defaultValue: 'Finanzas' })}
        </h1>
        <p className="text-muted mt-1">Gestión financiera de tu boda</p>
      </Card>

      <div className="space-y-6">
        {/* Mostrar errores si existen */}
        {error && (
          <Card className="mb-6">
            <h3 className="text-sm font-medium text-[color:var(--color-danger)]">
              {t("finance.error.title", { defaultValue: "Error en Gestión financiera" })}
            </h3>
            <div className="mt-2 text-sm text-[color:var(--color-danger-90)]">
              <p>{error}</p>
            </div>
          </Card>
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
              budgetUsage={budgetUsage}
              thresholds={settings?.alertThresholds}
              isLoading={isLoading}
              predictiveInsights={predictiveInsights}
              onNavigate={navigateToTransactions}
            />
            <FinanceCashflowTimeline
              monthlySeries={monthlySeries}
              predictiveInsights={predictiveInsights}
              stats={stats}
              budget={budget}
              projection={projection}
            />
          </div>
        )}

        {/* Contenido: Transacciones */}
        {activeTab === 'transactions' && (
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
        )}

        {/* Contenido: Presupuesto */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <BudgetManager
              budget={budget}
              budgetUsage={budgetUsage}
              stats={stats}
              providerCommittedByCategory={providerCommittedByCategory}
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
              onOpenWizard={() => setShowWizard(true)}
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
            <React.Suspense fallback={<div className="p-4">{t("finance.charts.loading", { defaultValue: "Cargando análisis" })}</div>}>
              <FinanceCharts transactions={transactions} budgetUsage={budgetUsage} stats={stats} />
            </React.Suspense>
          </div>
        )}
      </div>

      {/* Budget Wizard Modal */}
      <BudgetWizardModal
        open={showWizard}
        onClose={() => setShowWizard(false)}
        guestCount={contributions?.guestCount || activeWeddingData?.guestCount || 0}
        wantedServices={activeWeddingData?.wantedServices || activeWeddingData?.neededServices || []}
        contributions={contributions}
        onComplete={handleCompleteWizard}
        onRequestAdvisor={requestBudgetAdvisor}
        advisorData={advisor}
        advisorLoading={advisorLoading}
        benchmarks={benchmarkData}
        onApplyBenchmark={handleApplyBenchmark}
      />
    
    
  );
}

export default Finance;
