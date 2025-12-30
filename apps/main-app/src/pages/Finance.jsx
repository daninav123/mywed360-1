import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

import BudgetManager from '../components/finance/BudgetManager';
import BudgetWizardModal from '../components/finance/BudgetWizardModal';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceCashflowTimeline from '../components/finance/FinanceCashflowTimeline';
import TransactionManager from '../components/finance/TransactionManager';
import UpcomingPaymentsAlert from '../components/finance/UpcomingPaymentsAlert';
import PageTabs from '../components/ui/PageTabs';
import KPICard from '../components/ui/KPICard';
import Collapsible from '../components/ui/Collapsible';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FinanceCharts = React.lazy(() => import('../components/finance/FinanceCharts'));
import useFinance from '../hooks/useFinance';
import useProveedores from '../hooks/useProveedores';
import useTranslations from '../hooks/useTranslations';
import useBudgetBenchmarks from '../hooks/useBudgetBenchmarks';
import useProviderMigration from '../hooks/useProviderMigration';
import { useLocation } from 'react-router-dom';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';
import { formatCurrency } from '../utils/formatUtils';

function Finance() {
  const { t } = useTranslations();
  const { providers: supplierProviders = [] } = useProveedores();
  const location = useLocation();
  
  useProviderMigration();
  
  const [prefillTx, setPrefillTx] = useState(null);
  const [activeTab, setActiveTab] = useState('budget');
  const [transactionFiltersSignal, setTransactionFiltersSignal] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);

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

  const {
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
    stats,
    budgetUsage,
    settings,
    projection,
    predictiveInsights,
    monthlySeries,
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

  useEffect(() => {
    loadGuestCount();
  }, [loadGuestCount]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#nuevo') {
      setActiveTab('transactions');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (budget?.categories?.length > 0 && budget.total > 0) {
      setWizardCompleted(true);
    }
  }, [budget]);

  const navigateToTransactions = ({ tab = 'transactions', filters = {} } = {}) => {
    if (tab) setActiveTab(tab);
    setTransactionFiltersSignal({ version: Date.now(), filters });
  };

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
          t('finance.searchPlaceholder') || provider?.servicio || provider?.category || provider?.categoria || ''
        );
        if (legacyKey) {
          const currentAmount = map.get(legacyKey) || 0;
          const providerAmount = Number(provider?.assignedBudget || provider?.presupuestoAsignado || 0);
          map.set(legacyKey, currentAmount + providerAmount);
        }
      }
    });
    
    return map;
  }, [supplierProviders, t]);

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
        console.log('[Wizard] Distribución recibida:', wizardData.distribution);
        
        const categories = wizardData.distribution
          .filter(item => item.name !== 'Imprevistos')
          .map(item => {
            console.log(`[Wizard] Mapeando categoría: ${item.name}, amount: ${item.amount}`);
            return {
              name: item.name,
              amount: Number(item.amount) || 0,
              muted: false,
            };
          });
        
        console.log('[Wizard] Categorías finales a guardar:', categories);
        console.log('[Wizard] Total categorías:', categories.length);
        
        if (categories.length > 0) {
          setBudgetCategories(categories);
        } else {
          console.warn('[Wizard] No hay categorías para guardar después de filtrar Imprevistos');
        }
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

  const totalBudget = Number(budget?.total) || 0;
  const totalSpent = Number(stats?.totalSpent) || 0;
  const totalCommitted = Array.from(providerCommittedByCategory.values()).reduce((sum, val) => sum + val, 0);
  const totalUsed = Math.max(totalSpent, totalCommitted);
  const available = totalBudget - totalUsed;

  return (
    <div className="layout-container-wide py-6">
      {/* Header Mejorado con KPIs */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-body mb-1">💰 Finanzas</h1>
        <p className="text-muted mb-6">Gestión financiera de tu boda</p>

        {/* KPI Cards */}
          <KPICard
            label={t('finance.kpi.totalBudget', { defaultValue: 'Presupuesto Total' })}
            value={formatCurrency(totalBudget)}
            icon="💵"
            placeholder={t('finance.searchPlaceholder', { defaultValue: 'Buscar...' })}
          />
          <KPICard
            label={t('finance.kpi.spent', { defaultValue: 'Gastado' })}
            value={formatCurrency(totalSpent)}
            icon="💸"
            placeholder={t('finance.amountPlaceholder', { defaultValue: 'Cantidad...' })}
            color={totalSpent > totalBudget * 0.9 ? 'danger' : 'info'}
            trend={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% del total` : undefined}
          />
          <KPICard
            label={t('finance.kpi.available', { defaultValue: 'Disponible' })}
            value={formatCurrency(available)}
            icon="✨"
            color={available < 0 ? 'danger' : 'success'}
            trend={totalBudget > 0 ? `${((available / totalBudget) * 100).toFixed(1)}% restante` : undefined}
          />

            {/* Budget Manager */}
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

        {/* Tab: Transacciones */}
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

        {/* Tab: Análisis */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Timeline */}
            <FinanceCashflowTimeline
              monthlySeries={monthlySeries}
              predictiveInsights={predictiveInsights}
              stats={stats}
              budget={budget}
              projection={projection}
            />

            {/* Charts */}
            <React.Suspense fallback={<div className="p-4">{t("finance.charts.loading", { defaultValue: "Cargando gráficos..." })}</div>}>
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
    </div>
  );
}

export default Finance;
