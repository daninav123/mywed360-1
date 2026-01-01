import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Wallet, DollarSign } from 'lucide-react';

import BudgetManager from '../components/finance/BudgetManager';
import BudgetWizardModal from '../components/finance/BudgetWizardModal';
import ContributionSettings from '../components/finance/ContributionSettings';
import FinanceCashflowTimeline from '../components/finance/FinanceCashflowTimeline';
import TransactionManager from '../components/finance/TransactionManager';
import UpcomingPaymentsAlert from '../components/finance/UpcomingPaymentsAlert';
import PageTabs from '../components/ui/PageTabs';
import Collapsible from '../components/ui/Collapsible';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Nav from '../components/Nav';

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
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        <div className="mx-auto my-8" style={{
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          
          {/* Hero con degradado beige-dorado */}
          <header className="relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
            padding: '48px 32px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div className="max-w-4xl" style={{ textAlign: 'center' }}>
              {/* Título con líneas decorativas */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, #D4A574)',
                }} />
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#1F2937',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>Finanzas</h1>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to left, transparent, #D4A574)',
                }} />
              </div>
              
              {/* Subtítulo como tag uppercase */}
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '32px',
              }}>Gestión de Boda</p>
              
              {/* Tabs pills sin borde */}
              <div style={{ 
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[
                  { id: 'budget', label: t('finance.tabs.budget') || 'Presupuesto' },
                  { id: 'transactions', label: t('finance.tabs.transactions') || 'Transacciones' },
                  { id: 'analytics', label: t('finance.tabs.analytics') || 'Análisis' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      fontFamily: "'DM Sans', 'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: activeTab === tab.id ? 600 : 500,
                      padding: '10px 24px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      color: activeTab === tab.id ? '#1F2937' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.75)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Tab: Presupuesto */}
          {activeTab === 'budget' && (
            <>
            <section className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Total Budget Card - Beige dorado (CountdownCard) */}
              <div style={{
                backgroundColor: '#FFF4E6',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#D4A574',
                  opacity: 0.6,
                }} />
                <div className="space-y-1">
                  <h3 style={{
                    color: '#D4A574',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                  }}>{t('finance.kpi.totalBudget')}</h3>
                  <p className="text-3xl font-bold" style={{ color: '#D4A574' }}>{formatCurrency(totalBudget)}</p>
                </div>
              </div>

              {/* Spent Card - Rosa mauve (GuestListCard) */}
              <div style={{
                backgroundColor: totalSpent > totalBudget * 0.9 ? '#FFF0F0' : '#FCE4EC',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: totalSpent > totalBudget * 0.9 ? '#E57373' : '#C97C8F',
                  opacity: 0.6,
                }} />
                <div className="space-y-1">
                  <h3 style={{
                    color: totalSpent > totalBudget * 0.9 ? '#E57373' : '#C97C8F',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                  }}>{t('finance.kpi.spent')}</h3>
                  <p className="text-3xl font-bold" style={{ color: totalSpent > totalBudget * 0.9 ? '#E57373' : '#C97C8F' }}>
                    {formatCurrency(totalSpent)}
                  </p>
                  {totalBudget > 0 && (
                    <p style={{ 
                      fontSize: '12px', 
                      color: totalSpent > totalBudget * 0.9 ? '#E57373' : '#C97C8F',
                      opacity: 0.7 
                    }}>
                      {((totalSpent / totalBudget) * 100).toFixed(1)}% del total
                    </p>
                  )}
                </div>
              </div>

              {/* Available Card - Verde bosque (BudgetCard) */}
              <div style={{
                backgroundColor: available < 0 ? '#FFF0F0' : '#E8F5E9',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: available < 0 ? '#E57373' : '#4A9B5F',
                  opacity: 0.6,
                }} />
                <div className="space-y-1">
                  <h3 style={{
                    color: available < 0 ? '#E57373' : '#4A9B5F',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                  }}>{t('finance.kpi.available')}</h3>
                  <p className="text-3xl font-bold" style={{ color: available < 0 ? '#E57373' : '#4A9B5F' }}>
                    {formatCurrency(available)}
                  </p>
                  {totalBudget > 0 && (
                    <p style={{ 
                      fontSize: '12px', 
                      color: available < 0 ? '#E57373' : '#4A9B5F',
                      opacity: 0.7 
                    }}>
                      {((available / totalBudget) * 100).toFixed(1)}% restante
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Budget Manager */}
          <section className="px-6 py-6">
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #EEF2F7',
              padding: '24px',
            }}>
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
          </section>
            </>
          )}

          {/* Tab: Transacciones */}
          {activeTab === 'transactions' && (
            <section className="px-6 py-6">
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                padding: '24px',
              }}>
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
            </section>
          )}

          {/* Tab: Análisis */}
          {activeTab === 'analytics' && (
            <>
              {/* Timeline */}
              <section className="px-6 py-6">
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #EEF2F7',
                  padding: '24px',
                }}>
                <FinanceCashflowTimeline
              monthlySeries={monthlySeries}
              predictiveInsights={predictiveInsights}
              stats={stats}
              budget={budget}
              projection={projection}
                />
                </div>
              </section>

              {/* Charts */}
              <section className="px-6 py-6">
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #EEF2F7',
                  padding: '24px',
                }}>
                <React.Suspense fallback={<div className="p-4 text-muted">{t("finance.charts.loading")}</div>}>
                  <FinanceCharts transactions={transactions} budgetUsage={budgetUsage} stats={stats} />
                </React.Suspense>
                </div>
              </section>
            </>
          )}

        </div>
      </div>
      {/* Bottom Navigation */}
      <Nav />

      {/* Wizard Modal */}
      {showWizard && (
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
      )}
    </>
  );
};

export default Finance;
