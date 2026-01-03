import {
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Target,
  Sparkles,
  Loader2,
  Info,
  CheckCircle,
  Check,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import Modal from '../Modal';
import { Card, Button } from '../ui';
import BudgetCategoryCard from './BudgetCategoryCard';
import BudgetRebalanceModal from './BudgetRebalanceModal';

export default function BudgetManager({
  budget,
  budgetUsage,
  stats,
  providerCommittedByCategory,
  benchmarks,
  onApplyBenchmark,
  onCaptureSnapshot,
  guestCount = 0,
  onUpdateBudget,
  onAddCategory,
  onReallocateCategories,
  onUpdateCategory,
  onRemoveCategory,
  alertThresholds,
  onUpdateSettings,
  advisor = null,
  onRequestAdvisor,
  advisorLoading = false,
  advisorError = null,
  onApplyAdvisorScenario,
  onRefreshAdvisor,
  onOpenWizard,
}) {
  const { t } = useTranslations();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);
  const [newCategory, setNewCategory] = useState({ name: '', amount: '', categoryId: '' });
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [localAdvisorLoading, setLocalAdvisorLoading] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const lastSnapshotSignatureRef = useRef('');
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);
  const benchmarkState = benchmarks || {};
  const benchmarkSampleSize = benchmarkState.sampleSize || benchmarkState.total?.count || 0;
  const benchmarkConfidence = benchmarkState.confidence || 'very-low';
  const benchmarkAverage = Number(benchmarkState.total?.avg) || 0;
  const benchmarkApply =
    typeof onApplyBenchmark === 'function' ? onApplyBenchmark : () => {};
  const categories = Array.isArray(budget?.categories) ? budget.categories : [];
  const committedMap = useMemo(() => {
    if (providerCommittedByCategory instanceof Map) return providerCommittedByCategory;
    if (!providerCommittedByCategory || typeof providerCommittedByCategory !== 'object') return new Map();
    try {
      return new Map(Object.entries(providerCommittedByCategory));
    } catch {
      return new Map();
    }
  }, [providerCommittedByCategory]);
  const computedTotal = Number(budget?.total);
  const categoriesTotal = categories.reduce(
    (sum, cat) => sum + (Number(cat?.amount) || 0),
    0
  );
  const statsTotalBudget = Number(stats?.totalBudget);
  const statsExpectedBudget = Number(stats?.expectedIncome);
  const statsTotalSpent = Number(stats?.totalSpent);
  const totalBudgetValue =
    [computedTotal, statsTotalBudget, statsExpectedBudget, categoriesTotal].find(
      (value) => Number.isFinite(value) && value > 0
    ) || 0;
  const totalBudgetCents = Math.max(0, Math.round(totalBudgetValue * 100));
  const hasGlobalBudget = totalBudgetCents > 0;
  const categoriesTotalCents = Math.max(0, Math.round(categoriesTotal * 100));
  const thresholds = alertThresholds || { warn: 75, danger: 90 };
  const captureSnapshot =
    typeof onCaptureSnapshot === 'function' ? onCaptureSnapshot : null;
  useEffect(() => {
    const list = Array.isArray(budget?.categories) ? budget.categories : [];

    if (!captureSnapshot) {
      return undefined;
    }

    if (!list.length) {
      lastSnapshotSignatureRef.current = '';
      return undefined;
    }

    const signature = JSON.stringify(
      list
        .map((cat) => ({
          key: normalizeBudgetCategoryKey(cat?.name || ''),
          amount: Number(cat?.amount) || 0,
        }))
        .sort((a, b) => a.key.localeCompare(b.key))
    );

    if (!signature || lastSnapshotSignatureRef.current === signature) {
      return undefined;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      captureSnapshot({ status: 'confirmed', source: 'auto' });
      lastSnapshotSignatureRef.current = signature;
      autoSaveTimeoutRef.current = null;
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [captureSnapshot, budget?.categories]);
  const currentGuestCount = Number(guestCount) || 0;
  const effectiveAdvisor = advisor && typeof advisor === 'object' ? advisor : null;
  const advisorScenarios = Array.isArray(effectiveAdvisor?.scenarios)
    ? effectiveAdvisor.scenarios
    : [];
  const selectedScenario =
    advisorScenarios.find((scenario) => scenario.id === effectiveAdvisor?.selectedScenarioId) ||
    advisorScenarios[0] ||
    null;
  const advisorTips = Array.isArray(effectiveAdvisor?.globalTips)
    ? effectiveAdvisor.globalTips
    : [];

  const formatTotalInput = (value) => {
    if (!Number.isFinite(value)) return '';
    return (Math.round(value * 100) / 100).toFixed(2);
  };

/**
 * Reduce proporcionalmente las cantidades especificadas en `indices` hasta cubrir `delta`.
 * Respeta los mínimos definidos en `minBounds` (por ejemplo, gasto real ya registrado).
 * Mutamos el array `amounts` en céntimos para evitar problemas de precisión.
 * Devuelve el remanente que no se pudo recortar (por ejemplo, si todas las categorías llegaron a su mínimo).
 */
const distributeDecrease = (amounts, indices, delta, minBounds = []) => {
  let remaining = delta;
  let adjustable = indices.filter((idx) => amounts[idx] > (minBounds[idx] ?? 0));

  while (remaining > 0 && adjustable.length) {
    const totalAdjustable = adjustable.reduce(
      (sum, idx) => sum + Math.max(0, amounts[idx] - (minBounds[idx] ?? 0)),
      0
    );
    if (totalAdjustable <= 0) break;

    let remainder = remaining;
    const plan = new Map();
    adjustable.forEach((idx) => {
      const currentAmount = amounts[idx];
      const minAmount = minBounds[idx] ?? 0;
      const available = Math.max(0, currentAmount - minAmount);
      if (available <= 0) {
        plan.set(idx, 0);
        return;
      }
      const deduction = Math.min(
        available,
        Math.floor((remaining * available) / Math.max(totalAdjustable, 1))
      );
      plan.set(idx, deduction);
      remainder -= deduction;
    });

    if (remainder > 0) {
      const sorted = [...adjustable].sort(
        (a, b) =>
          (amounts[b] - (minBounds[b] ?? 0) - (plan.get(b) || 0)) -
          (amounts[a] - (minBounds[a] ?? 0) - (plan.get(a) || 0))
      );
      let pointer = 0;
      while (remainder > 0 && sorted.length) {
        const idx = sorted[pointer % sorted.length];
        const minAmount = minBounds[idx] ?? 0;
        const available = Math.max(0, amounts[idx] - minAmount - (plan.get(idx) || 0));
        if (available <= 0) {
          sorted.splice(pointer % sorted.length, 1);
          continue;
        }
        plan.set(idx, (plan.get(idx) || 0) + 1);
        remainder -= 1;
          pointer += 1;
        }
      }

    let totalDeducted = 0;
    plan.forEach((deduction, idx) => {
      if (deduction <= 0) return;
      const minAmount = minBounds[idx] ?? 0;
      const available = Math.max(0, amounts[idx] - minAmount);
      const applied = Math.min(available, deduction);
      amounts[idx] = Math.max(minAmount, amounts[idx] - applied);
      totalDeducted += applied;
    });

    remaining -= totalDeducted;
    adjustable = adjustable.filter((idx) => amounts[idx] > (minBounds[idx] ?? 0));
    if (totalDeducted === 0) break;
  }

  return remaining;
};

/**
 * Incrementa proporcionalmente las categorías en `indices` con el presupuesto disponible `delta`.
 * Devuelve el remanente que no logró asignarse (habitualmente porque no existen categorías destino).
 */
const distributeIncrease = (amounts, indices, delta) => {
    let remaining = delta;
    if (!indices.length) return remaining;

    let adjustable = indices.slice();
    while (remaining > 0 && adjustable.length) {
      const totalWeights = adjustable.reduce((sum, idx) => sum + amounts[idx], 0);
      let remainder = remaining;
      const plan = new Map();

      if (totalWeights === 0) {
        const base = Math.floor(remaining / adjustable.length);
        adjustable.forEach((idx) => {
          plan.set(idx, base);
          remainder -= base;
        });
      } else {
        adjustable.forEach((idx) => {
          const weight = amounts[idx];
          const addition = Math.floor((remaining * weight) / totalWeights);
          plan.set(idx, addition);
          remainder -= addition;
        });
      }

      if (remainder > 0) {
        const sorted = [...adjustable].sort(
          (a, b) => (amounts[a] || 0) - (amounts[b] || 0)
        );
        let pointer = 0;
        while (remainder > 0 && sorted.length) {
          const idx = sorted[pointer % sorted.length];
          plan.set(idx, (plan.get(idx) || 0) + 1);
          remainder -= 1;
          pointer += 1;
        }
      }

      let totalAdded = 0;
      plan.forEach((addition, idx) => {
        if (addition <= 0) return;
        amounts[idx] += addition;
        totalAdded += addition;
      });

      remaining -= totalAdded;
      if (totalAdded === 0) break;
    }

    return remaining;
  };

  /**
   * Reasigna el presupuesto cuando el usuario mueve el slider de una categoría.
   * Pasos principales:
   *  1. Convertimos todas las categorías a céntimos para trabajar con enteros.
   *  2. Intentamos satisfacer el nuevo valor utilizando primero el presupuesto libre
   *     (total global - suma actual). Si no es suficiente, reducimos al resto de categorías
   *     de forma proporcional mediante `distributeDecrease`.
   *  3. Al reducir una categoría liberamos presupuesto y lo repartimos entre el resto con
   *     `distributeIncrease`, evitando que el total global quede desbalanceado.
   *  4. Garantizamos que la suma final nunca sobrepase el presupuesto total y normalizamos
   *     el resultado a euros con dos decimales.
   */
  const handleAllocationChange = (index, targetCents) => {
    if (!onReallocateCategories || !categories.length) return;

    if (!hasGlobalBudget) {
      const normalizedCentValue = Math.max(0, targetCents);
      const nextCategories = categories.map((cat, idx) => ({
        ...cat,
        amount:
          idx === index
            ? Number((normalizedCentValue / 100).toFixed(2))
            : Number((Math.max(0, Math.round((Number(cat?.amount) || 0) * 100)) / 100).toFixed(2)),
      }));
      onReallocateCategories(nextCategories);
      return;
    }

    const minBounds = categories.map((_, idx) =>
      Math.max(0, Math.round((Number(budgetUsage[idx]?.spent) || 0) * 100))
    );

    const safeTarget = Math.max(
      minBounds[index] ?? 0,
      Math.min(targetCents, totalBudgetCents)
    );
    const currentAmounts = categories.map((cat, idx) =>
      Math.max(0, Math.round((Number(cat?.amount) || 0) * 100))
    );
    const currentAmountCents = currentAmounts[index] || 0;
    if (safeTarget === currentAmountCents) return;

    const otherIndices = categories
      .map((_, idx) => idx)
      .filter((idx) => idx !== index);
    const currentTotal = currentAmounts.reduce((sum, value) => sum + value, 0);
    const availablePool = Math.max(0, totalBudgetCents - currentTotal);

    const nextAmounts = currentAmounts.slice();
    nextAmounts[index] = safeTarget;

    const delta = safeTarget - currentAmountCents;
    if (delta > 0) {
      let remainingIncrease = delta;
      if (availablePool > 0) {
        const consume = Math.min(availablePool, remainingIncrease);
        remainingIncrease -= consume;
      }
      if (remainingIncrease > 0) {
        const leftover = distributeDecrease(nextAmounts, otherIndices, remainingIncrease, minBounds);
        if (leftover > 0) {
          nextAmounts[index] = Math.max(minBounds[index] ?? 0, nextAmounts[index] - leftover);
        }
      }
    } else {
      const remainingDecrease = -delta;
      distributeIncrease(nextAmounts, otherIndices, remainingDecrease);
    }

    let totalAfter = nextAmounts.reduce((sum, value) => sum + value, 0);
    if (totalAfter > totalBudgetCents) {
      let overflow = totalAfter - totalBudgetCents;
      const reduceFromTarget = Math.min(
        overflow,
        Math.max(0, nextAmounts[index] - (minBounds[index] ?? 0))
      );
      nextAmounts[index] -= reduceFromTarget;
      overflow -= reduceFromTarget;
      if (overflow > 0) {
        distributeDecrease(nextAmounts, otherIndices, overflow, minBounds);
      }
      totalAfter = nextAmounts.reduce((sum, value) => sum + value, 0);
    }

    nextAmounts.forEach((amount, idx) => {
      const minAllowed = minBounds[idx] ?? 0;
      if (amount < minAllowed) {
        nextAmounts[idx] = minAllowed;
      }
    });

    const nextCategories = nextAmounts.map((amountCents, idx) => ({
      ...categories[idx],
      amount: Number((amountCents / 100).toFixed(2)),
    }));

    onReallocateCategories(nextCategories);
  };

  const formatTimestamp = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleString();
    } catch {
      return null;
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', amount: '', categoryId: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category, index) => {
    setEditingCategory(category);
    setEditingCategoryIndex(index);
    // Buscar categoryId si existe
    const matchedCategory = SUPPLIER_CATEGORIES.find(cat => 
      cat.name === category.name || cat.id === normalizeBudgetCategoryKey(category.name)
    );
    setNewCategory({ 
      name: category.name, 
      amount: String(Number(category.amount || 0)),
      categoryId: matchedCategory?.id || ''
    });
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = (index, updatedCategory) => {
    const oldCategory = categories[index];
    const oldAmount = Number(oldCategory?.amount) || 0;
    const newAmount = Number(updatedCategory?.amount) || 0;
    
    const currentTotal = categories.reduce((sum, cat, idx) => {
      if (idx === index) return sum;
      return sum + (Number(cat?.amount) || 0);
    }, 0);
    
    const totalAfterChange = currentTotal + newAmount;
    const totalBudgetValue = Number(budget?.total) || 0;
    
    if (newAmount > oldAmount && totalAfterChange > totalBudgetValue) {
      setRebalanceData({
        categoryName: updatedCategory.name,
        oldAmount,
        newAmount,
        categoryIndex: index,
        updatedCategory,
      });
      setShowRebalanceModal(true);
    } else {
      const updated = [...categories];
      updated[index] = updatedCategory;
      onUpdateCategory(index, updatedCategory);
      setEditingCategory(null);
      setEditingCategoryIndex(-1);
    }
  };

  const handleRebalanceApply = (rebalancedCategories) => {
    onReallocateCategories(rebalancedCategories);
    setShowRebalanceModal(false);
    setRebalanceData(null);
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
  };

  const handleSaveCategory = () => {
    const amount = Number(newCategory.amount);
    
    // Validar que se haya seleccionado una categoría (solo para nuevas)
    if (!editingCategory && !newCategory.categoryId) {
      toast.error(t('finance.budget.errors.categoryRequired'));
      return;
    }
    
    if (!newCategory.name.trim()) {
      toast.error(t('finance.budget.errors.nameRequired'));
      return;
    }
    if (isNaN(amount) || amount < 0) {
      toast.error(t('finance.budget.errors.amountInvalid'));
      return;
    }
    
    if (editingCategory) {
      const updatedCategory = { name: newCategory.name.trim(), amount };
      handleUpdateCategory(editingCategoryIndex, updatedCategory);
      setShowCategoryModal(false);
      setNewCategory({ name: '', amount: '', categoryId: '' });
    } else {
      // Usar el nombre oficial de SUPPLIER_CATEGORIES
      const selectedCategory = SUPPLIER_CATEGORIES.find(cat => cat.id === newCategory.categoryId);
      const categoryName = selectedCategory?.name || newCategory.name.trim();
      
      const result = onAddCategory(categoryName, amount);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setEditingCategoryIndex(-1);
      setNewCategory({ name: '', amount: '', categoryId: '' });
    }
  };

  const handleDeleteCategory = (index, categoryName) => {
    const confirmMessage = t('finance.budget.confirmDelete', {
      category: categoryName,
    });
    if (window.confirm(confirmMessage)) {
      onRemoveCategory(index);
    }
  };

  const ensureAdvisorData = async () => {
    if (!onRequestAdvisor) return;
    setLocalAdvisorLoading(true);
    try {
      await onRequestAdvisor();
    } catch (err) {
      // console.error('[BudgetManager] advisor request failed', err);
      toast.error(err?.message || t('finance.budget.advisorErrors.requestFailed'));
    } finally {
      setLocalAdvisorLoading(false);
    }
  };

  const handleOpenAdvisor = async () => {
    setShowAdvisorModal(true);
    if (!effectiveAdvisor?.scenarios?.length && onRequestAdvisor) {
      await ensureAdvisorData();
    }
  };

  const handleRefreshAdvisor = async () => {
    if (onRefreshAdvisor) {
      try {
        setLocalAdvisorLoading(true);
        await onRefreshAdvisor();
      } catch (err) {
        // console.error('[BudgetManager] advisor refresh failed', err);
        toast.error(err?.message || t('finance.budget.advisorErrors.refreshFailed'));
      } finally {
        setLocalAdvisorLoading(false);
      }
      return;
    }
    await ensureAdvisorData();
  };

  const handleApplyScenario = async (scenarioId) => {
    if (!onApplyAdvisorScenario) return;
    try {
      const result = await Promise.resolve(onApplyAdvisorScenario(scenarioId));
      if (result && result.ok === false) {
        const message = result.reason
          ? t('finance.budget.advisorErrors.applyFailedWithReason', {
              reason: result.reason,
            })
          : t('finance.budget.advisorErrors.applyFailed');
        toast.error(message);
      } else {
        setShowAdvisorModal(false);
      }
    } catch (err) {
      // console.error('[BudgetManager] apply advisor scenario failed', err);
      toast.error(err?.message || t('finance.budget.advisorErrors.applyFailed'));
    }
  };

  const totalBudgeted = categories.reduce(
    (sum, cat) => sum + (Number(cat.amount) || 0),
    0
  );
  const totalSpent =
    statsTotalSpent > 0
      ? statsTotalSpent
      : (budgetUsage || []).reduce((sum, cat) => sum + (Number(cat.spent) || 0), 0);

  // Calcular % total usado
  const totalUsagePercent = totalBudgetValue > 0 ? (totalSpent / totalBudgetValue) * 100 : 0;
  const budgetRemaining = totalBudgetValue - totalSpent;

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card className="p-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
              {t('finance.budget.title', { defaultValue: 'Categorías de Presupuesto' })}
            </h2>
            <p className="text-sm text-[color:var(--color-text-70)]">
              {categories.length} {t('finance.budget.categories', { defaultValue: 'categorías' })}
            </p>
          </div>
          <div className="flex gap-2">
            {onOpenWizard && (
              <Button 
                variant="outline" 
                leftIcon={<Sparkles size={16} />} 
                onClick={onOpenWizard}
              >
                {t('finance.budget.reopenWizard', { defaultValue: 'Rehacer Asistente' })}
              </Button>
            )}
            <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
              {t('finance.budget.newCategory', { defaultValue: 'Nueva categoría' })}
            </Button>
          </div>
        </div>
      </Card>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-text-5)] mb-4">
            <PieChart className="w-8 h-8 text-[color:var(--color-text-40)]" />
          </div>
          <p className="text-lg font-medium text-[color:var(--color-text-80)] mb-2">
            {t('finance.budget.empty', { defaultValue: 'No hay categorías de presupuesto' })}
          </p>
          <p className="text-sm text-[color:var(--color-text-60)] mb-6">
            {t('finance.budget.emptyHint', { defaultValue: 'Crea categorías para organizar tu presupuesto de boda' })}
          </p>
          <Button
            onClick={handleAddCategory}
            leftIcon={<Plus size={16} />}
          >
            {t('finance.budget.newCategory', { defaultValue: 'Nueva categoría' })}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(budgetUsage || categories.map((cat) => ({ ...cat, spent: 0, percentage: 0 }))).map((category, index) => {
            const rawCategory = categories[index];
            const categoryKey = normalizeBudgetCategoryKey(rawCategory?.name ?? category?.name ?? '');
            const assignedAmountRaw = Number(
              rawCategory?.amount ?? category.amount ?? 0
            );
            const assignedAmount = Number.isFinite(assignedAmountRaw) ? assignedAmountRaw : 0;
            
            if (index === 0) {
              console.log('[BudgetManager] Primera categoría debug:');
              console.log('  - rawCategory:', rawCategory);
              console.log('  - rawCategory.amount:', rawCategory?.amount);
              console.log('  - category.amount:', category.amount);
              console.log('  - assignedAmountRaw:', assignedAmountRaw);
              console.log('  - assignedAmount FINAL:', assignedAmount);
            }
            const spentAmount = Number(category.spent) || 0;
            const committedAmount = categoryKey ? Number(committedMap.get(categoryKey)) || 0 : 0;
            const percentageValue = Number(category.percentage);
            const usageBase = Number.isFinite(percentageValue)
              ? percentageValue
              : assignedAmount > 0
                ? (spentAmount / assignedAmount) * 100
                : spentAmount > 0
                  ? 999
                  : 0;
            const usagePercent = Math.min(Math.max(usageBase, 0), 999);

            return (
              <BudgetCategoryCard
                key={category.name || index}
                category={category}
                index={index}
                assignedAmount={assignedAmount}
                spentAmount={spentAmount}
                committedAmount={committedAmount}
                usagePercent={usagePercent}
                thresholds={thresholds}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                t={t}
              />
            );
          })}
        </div>
      )}

      <Modal
        open={showAdvisorModal}
        onClose={() => {
          if (!localAdvisorLoading && !advisorLoading) {
            setShowAdvisorModal(false);
          }
        }}
        title="Consejero IA de presupuesto"
      >
        <div className="space-y-4">
          {(advisorLoading || localAdvisorLoading) && (
            <div className="flex items-center justify-center py-6 text-[color:var(--color-text-70)]">
              <Loader2 className="animate-spin mr-2" size={18} />
              Calculando recomendaciones...
            </div>
          )}

          {!advisorLoading && !localAdvisorLoading && advisorError && (
            <div className="rounded-md border border-[color:var(--color-danger-30)] bg-[var(--color-danger-10)] p-4 text-sm text-[color:var(--color-danger)]">
              {advisorError}
            </div>
          )}

          {!advisorLoading &&
            !localAdvisorLoading &&
            !advisorError &&
            advisorScenarios.length === 0 && (
              <div className="rounded-lg border border-dashed border-[color:var(--color-text-20)] p-6 text-center text-sm text-[color:var(--color-text-70)] space-y-3">
                <p>No hay escenarios disponibles todavía.</p>
                <Button
                  leftIcon={<Sparkles size={16} />}
                  onClick={ensureAdvisorData}
                  disabled={advisorLoading || localAdvisorLoading}
                >
                  Solicitar recomendación
                </Button>
              </div>
            )}

          {!advisorLoading && !localAdvisorLoading && advisorScenarios.length > 0 && (
            <div className="space-y-4">
              {advisorScenarios.map((scenario, idx) => {
                const allocation = Array.isArray(scenario.allocation)
                  ? scenario.allocation
                  : [];
                const isApplied =
                  scenario.id &&
                  scenario.id === effectiveAdvisor?.selectedScenarioId &&
                  effectiveAdvisor?.appliedAt;

                return (
                  <div
                    key={scenario.id || idx}
                    className="rounded-lg border border-soft bg-surface shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 px-4 py-3 border-b border-soft">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
                          <Sparkles className="text-[color:var(--color-primary)]" size={16} />
                          {scenario.label || `Escenario ${idx + 1}`}
                          {isApplied && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-success-10)] text-[color:var(--color-success)]">
                              <CheckCircle size={12} />
                              Aplicado
                            </span>
                          )}
                        </div>
                        {scenario.summary && (
                          <p className="text-sm text-[color:var(--color-text-70)] mt-1">
                            {scenario.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border border-[color:var(--color-primary-40)] text-[color:var(--color-primary)] hover:bg-[var(--color-primary-10)] disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => handleApplyScenario(scenario.id)}
                          disabled={advisorLoading || localAdvisorLoading}
                        >
                          {(advisorLoading || localAdvisorLoading) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Target size={14} />
                          )}
                          Aplicar escenario
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {allocation.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-[color:var(--color-text-60)] uppercase tracking-wide text-xs">
                                <th className="py-2 pr-4">Categoría</th>
                                <th className="py-2 pr-4">Distribución</th>
                                <th className="py-2 pr-4">Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allocation.map((entry, entryIdx) => {
                                const pct =
                                  entry.percentage != null
                                    ? `${Number(entry.percentage).toFixed(1)}%`
                                    : null;
                                const amount =
                                  entry.amount != null
                                    ? formatCurrency(Number(entry.amount))
                                    : null;
                                const distribution = [pct, amount]
                                  .filter(Boolean)
                                  .join(' · ');

                                return (
                                  <tr
                                    key={`${scenario.id || idx}-allocation-${entryIdx}`}
                                    className="border-t border-[color:var(--color-text-10)]"
                                  >
                                    <td className="py-2 pr-4 font-medium text-[color:var(--color-text)]">
                                      {entry.category || 'Categoria'}
                                    </td>
                                    <td className="py-2 pr-4 text-[color:var(--color-text-80)]">
                                      {distribution || '—'}
                                    </td>
                                    <td className="py-2 pr-4 text-[color:var(--color-text-60)]">
                                      {entry.notes || 'Sin observaciones'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {Array.isArray(scenario.alerts) && scenario.alerts.length > 0 && (
                        <div className="rounded-md border border-[color:var(--color-warning-30)] bg-[var(--color-warning-10)] p-3 space-y-2 text-xs text-[color:var(--color-text-80)]">
                          {scenario.alerts.map((alert, alertIdx) => (
                            <div key={alertIdx} className="flex items-start gap-2">
                              <AlertTriangle size={12} className="mt-0.5 text-[color:var(--color-warning)]" />
                              <span>{alert}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setEditingCategoryIndex(-1);
          setNewCategory({ name: '', amount: '', categoryId: '' });
        }}
        title={
          editingCategory
            ? t('finance.budget.modal.editTitle', { defaultValue: 'Editar categoría' })
            : t('finance.budget.modal.newTitle', { defaultValue: 'Nueva categoría' })
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-2">
              {t('finance.budget.modal.name', { defaultValue: 'Selecciona una categoría de proveedor' })}
            </label>
            {!editingCategory ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
                {SUPPLIER_CATEGORIES.map((cat) => {
                  const isSelected = newCategory.categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setNewCategory({ 
                          ...newCategory, 
                          categoryId: cat.id, 
                          name: cat.name 
                        });
                      }}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                        ${isSelected 
                          ? 'border-purple-600 bg-purple-50 hover:bg-purple-100' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-lg">{cat.icon === 'camera' ? '📷' : 
                        cat.icon === 'video' ? '🎥' :
                        cat.icon === 'music' ? '🎵' :
                        cat.icon === 'disc' ? '💿' :
                        cat.icon === 'utensils' ? '🍽️' :
                        cat.icon === 'home' ? '🏛️' :
                        cat.icon === 'flower' ? '🌸' :
                        cat.icon === 'palette' ? '🎨' :
                        cat.icon === 'shirt' ? '👔' :
                        cat.icon === 'sparkles' ? '✨' :
                        cat.icon === 'gem' ? '💎' :
                        cat.icon === 'cake' ? '🎂' :
                        cat.icon === 'mail' ? '📧' :
                        cat.icon === 'gift' ? '🎁' :
                        cat.icon === 'car' ? '🚗' :
                        cat.icon === 'party-popper' ? '🎉' :
                        cat.icon === 'lightbulb' ? '💡' :
                        '📋'
                      }</span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{newCategory.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {t('finance.budget.modal.editingNote', { defaultValue: 'No puedes cambiar la categoría al editar. Crea una nueva si necesitas otra categoría.' })}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
              {t('finance.budget.modal.amountLabel', { defaultValue: 'Assigned budget (€)' })}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newCategory.amount}
              onChange={(e) => setNewCategory({ ...newCategory, amount: e.target.value })}
              placeholder={t('finance.budget.modal.amountPlaceholder', { defaultValue: '0.00' })}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setEditingCategoryIndex(-1);
                setNewCategory({ name: '', amount: '', categoryId: '' });
              }}
            >
              {t('app.cancel', { defaultValue: 'Cancelar' })}
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory
                ? t('app.update', { defaultValue: 'Actualizar' })
                : t('app.create', { defaultValue: 'Crear' })}{' '}
              {t('finance.budget.category', { defaultValue: 'categoría' })}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Budget Rebalance Modal */}
      {showRebalanceModal && rebalanceData && (
        <BudgetRebalanceModal
          open={showRebalanceModal}
          onClose={() => {
            setShowRebalanceModal(false);
            setRebalanceData(null);
            setEditingCategory(null);
            setEditingCategoryIndex(-1);
          }}
          categoryName={rebalanceData.categoryName}
          oldAmount={rebalanceData.oldAmount}
          newAmount={rebalanceData.newAmount}
          categories={categories}
          totalBudget={Number(budget?.total) || 0}
          onApply={handleRebalanceApply}
          t={t}
        />
      )}
    </div>
  );
}
