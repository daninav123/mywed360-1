import {
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Target,
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
  CheckCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';
import Modal from '../Modal';
import { Card, Button } from '../ui';

export default function BudgetManager({
  budget,
  budgetUsage,
  stats,
  benchmarks,
  onApplyBenchmark,
  onCaptureSnapshot,
  guestCount = 0,
  onUpdateBudget,
  onAddCategory,
  onReallocateCategories,
  onUpdateCategory,
  onRemoveCategory,
  advisor = null,
  onRequestAdvisor,
  advisorLoading = false,
  advisorError = null,
  onApplyAdvisorScenario,
  onRefreshAdvisor,
}) {
  const { t } = useTranslations();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);
  const [newCategory, setNewCategory] = useState({ name: '', amount: '' });
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [localAdvisorLoading, setLocalAdvisorLoading] = useState(false);
  const benchmarkState = benchmarks || {};
  const benchmarkSampleSize = benchmarkState.sampleSize || benchmarkState.total?.count || 0;
  const benchmarkConfidence = benchmarkState.confidence || 'very-low';
  const benchmarkAverage = Number(benchmarkState.total?.avg) || 0;
  const benchmarkApply =
    typeof onApplyBenchmark === 'function' ? onApplyBenchmark : () => {};
  const captureSnapshot =
    typeof onCaptureSnapshot === 'function' ? onCaptureSnapshot : () => {};
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

  const categories = Array.isArray(budget?.categories) ? budget.categories : [];
  const computedTotal = Number(budget?.total);
  const categoriesTotal = categories.reduce(
    (sum, cat) => sum + (Number(cat?.amount) || 0),
    0
  );
  const statsTotalBudget = Number(stats?.totalBudget);
  const statsExpectedBudget = Number(stats?.expectedIncome);
  const statsTotalSpent = Number(stats?.totalSpent);
    [computedTotal, statsTotalBudget, statsExpectedBudget, categoriesTotal].find(
      (value) => Number.isFinite(value) && value > 0
    ) || 0;

  const formatTotalInput = (value) => {
    if (!Number.isFinite(value)) return '';
    return (Math.round(value * 100) / 100).toFixed(2);
  };  const handleTotalDraftChange = (event) => {
    setTotalDraftDirty(true);
    setTotalDraft(event.target.value);
    setTotalDraftError('');
  };

  const applyTotalDraft = () => {
    const normalized = parseTotalDraft(totalDraft);
    if (!Number.isFinite(normalized) || normalized < 0) {
      setTotalDraftError('Introduce un número válido mayor o igual a 0.');
      return;
    }
    setTotalDraft(formatTotalInput(normalized));
    setTotalDraftDirty(false);
    setTotalDraftError('');
    onUpdateBudget?.(normalized);
  };

  const resetTotalDraft = () => {
    setTotalDraftDirty(false);
    setTotalDraft(formatTotalInput(baselineTotal));
    setTotalDraftError('');
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
    setNewCategory({ name: '', amount: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category, index) => {
    setEditingCategory(category);
    setEditingCategoryIndex(index);
    setNewCategory({ name: category.name, amount: String(Number(category.amount || 0)) });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    const amount = Number(newCategory.amount);
    if (!newCategory.name.trim()) {
      alert('El nombre de la categoría es obligatorio');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      alert('El monto debe ser un Número valido');
      return;
    }
    if (editingCategory) {
      onUpdateCategory(editingCategoryIndex, { name: newCategory.name.trim(), amount });
    } else {
      const result = onAddCategory(newCategory.name.trim(), amount);
      if (!result.success) {
        alert(result.error);
        return;
      }
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setNewCategory({ name: '', amount: '' });
  };

  const handleDeleteCategory = (index, categoryName) => {
    if (window.confirm(`Estas seguro de eliminar la categoría "${categoryName}"?`)) {
      onRemoveCategory(index);
    }
  };

  const ensureAdvisorData = async () => {
    if (!onRequestAdvisor) return;
    setLocalAdvisorLoading(true);
    try {
      await onRequestAdvisor();
    } catch (err) {
      console.error('[BudgetManager] advisor request failed', err);
      alert(err?.message || 'No se pudo obtener la recomendación del consejero.');
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
        console.error('[BudgetManager] advisor refresh failed', err);
        alert(err?.message || 'No se pudo actualizar la recomendación.');
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
        const message = result.reason ? ` (${result.reason})` : '';
        alert(`No se pudo aplicar el escenario${message}.`);
      } else {
        setShowAdvisorModal(false);
      }
    } catch (err) {
      console.error('[BudgetManager] apply advisor scenario failed', err);
      alert(err?.message || 'No se pudo aplicar el escenario recomendado.');
    }
  };

  const totalBudgetedRaw = budget.categories.reduce(
    (sum, cat) => sum + (Number(cat.amount) || 0),
    0
  );
  const totalBudgeted =
    totalBudgetedRaw > 0 ? totalBudgetedRaw : totalBudgetValue;
    statsTotalSpent > 0
      ? statsTotalSpent
      : budgetUsage.reduce((sum, cat) => sum + (Number(cat.spent) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
            {t('finance.budget.title', { defaultValue: 'Gestión de presupuesto' })}
          </h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            {t('finance.budget.subtitle', {
              defaultValue: 'Organiza y controla el presupuesto por categorías',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<CheckCircle size={16} />}
            onClick={captureSnapshot}
          >
            {t('finance.benchmarks.saveSnapshot', { defaultValue: 'Guardar presupuesto' })}
          </Button>
          <Button
            variant="outline"
            leftIcon={
              advisorLoading || localAdvisorLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )
            }
            onClick={handleOpenAdvisor}
            disabled={advisorLoading || localAdvisorLoading}
          >
            Abrir consejero
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
            {t('finance.budget.newCategory', { defaultValue: 'Nueva categoría' })}
          </Button>
        </div>
      </div>

      {benchmarkState.loading && (
        <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-2 text-sm text-indigo-700">
          {t('finance.benchmarks.loading', {
            defaultValue: 'Calculando sugerencias de presupuesto…',
          })}
        </div>
      )}

      {!benchmarkState.loading && benchmarkSampleSize > 0 && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-indigo-700">
              {t('finance.benchmarks.title', {
                defaultValue: 'Sugerencias de presupuesto basadas en bodas similares',
              })}
            </p>
            <p className="text-xs text-indigo-600">
              {t('finance.benchmarks.subtitle', {
                defaultValue:
                  'Basado en {{count}} presupuestos confirmados. Media estimada: {{average}} · Confianza: {{confidence}}.',
                count: benchmarkSampleSize,
                average: formatCurrency(benchmarkAverage),
                confidence: benchmarkConfidence,
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => benchmarkApply('p50')}
            >
              {t('finance.benchmarks.applyMedian', { defaultValue: 'Aplicar mediana (p50)' })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => benchmarkApply('p75')}
            >
              {t('finance.benchmarks.applyP75', { defaultValue: 'Aplicar percentil 75' })}
            </Button>
          </div>
        </div>
      )}

      <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">
              {t('finance.budget.totalBudget', { defaultValue: 'Presupuesto Total' })}
            </p>
            <p className="text-2xl font-bold text-[color:var(--color-text)]">
              {formatCurrency(totalBudgetValue || 0)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-success)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[color:var(--color-success)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">
              {t('finance.budget.budgeted', { defaultValue: 'Presupuestado' })}
            </p>
            <p className="text-2xl font-bold text-[color:var(--color-success)]">
              {formatCurrency(totalBudgeted)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-danger)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[color:var(--color-danger)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">
              {t('finance.budget.spent', { defaultValue: 'Gastado' })}
            </p>
            <p className="text-2xl font-bold text-[color:var(--color-danger)]">
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
          <div className="w-full bg-[color:var(--color-text)]/10 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${totalSpent > budget.total ? 'bg-[var(--color-danger)]' : totalSpent > budget.total * 0.8 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`}
              style={{ width: `${Math.min((totalSpent / budget.total) * 100, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
        <div className="px-6 py-4 border-b border-[color:var(--color-text)]/10 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-medium text-[color:var(--color-text)]">
            {t('finance.budget.categoriesTitle', { defaultValue: 'categorías de presupuesto' })}
          </h3>
          {budgetUsage.length > 0 && (
            <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
              {t('finance.budget.addCategory', { defaultValue: 'Añadir categoría' })}
            </Button>
          )}
        </div>
        {advisorScenarios.length > 0 && (
          <div className="px-6 py-4 bg-[var(--color-primary)]/5 border-b border-[var(--color-primary)]/20 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <Sparkles size={18} />
                <span className="text-sm font-semibold">
                  {selectedScenario?.label || 'Consejero IA listo'}
                </span>
                {effectiveAdvisor?.requestedAt && (
                  <span className="text-xs text-[color:var(--color-text)]/60">
                    Actualizado {formatTimestamp(effectiveAdvisor.requestedAt)}
                  </span>
                )}
              </div>
              {selectedScenario?.summary && (
                <p className="text-sm text-[color:var(--color-text)]/80">{selectedScenario.summary}</p>
              )}
              {advisorTips.length > 0 && (
                <ul className="text-xs text-[color:var(--color-text)]/70 list-disc pl-5 space-y-1">
                  {advisorTips.slice(0, 3).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button
                variant="ghost"
                className="justify-start"
                leftIcon={<Info size={16} />}
                onClick={handleOpenAdvisor}
                disabled={advisorLoading || localAdvisorLoading}
              >
                Ver escenarios
              </Button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleRefreshAdvisor}
                disabled={advisorLoading || localAdvisorLoading}
              >
                {(advisorLoading || localAdvisorLoading) ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Actualizar consejero
              </button>
            </div>
          </div>
        )}
        {advisorError && (
          <div className="px-6 py-3 text-sm text-[color:var(--color-danger)] bg-[var(--color-danger)]/10 border-b border-[var(--color-danger)]/30">
            {advisorError}
          </div>
        )}
        {budgetUsage.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[color:var(--color-text)]/70 mb-4">
              {t('finance.budget.empty', { defaultValue: 'No hay categorías de presupuesto' })}
            </p>
            <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
              {t('finance.budget.createFirst', { defaultValue: 'Crear primera categoría' })}
            </Button>
          </div>
        ) : (
          <div className="px-5 py-3">
            <div className="space-y-1.5">
              {budgetUsage.map((category, index) => {
              const rawCategory = categories[index] || {};
              const assignedAmountRaw = Number(
                rawCategory?.amount ?? category.amount ?? 0
              );
              const assignedAmount = Number.isFinite(assignedAmountRaw) ? assignedAmountRaw : 0;
              const assignedCents = Math.max(0, Math.round(assignedAmount * 100));
              const spentAmount = Number(category.spent) || 0;
              const percentageValue = Number(category.percentage);
              const usageBase = Number.isFinite(percentageValue)
                ? percentageValue
                : assignedAmount > 0
                  ? (spentAmount / assignedAmount) * 100
                  : spentAmount > 0
                    ? 999
                    : 0;
              const usagePercent = Math.min(Math.max(usageBase, 0), 999);
              const progressPercent = Math.min(usagePercent, 100);
              const barColor =
                usagePercent >= (alertThresholds.danger || 90)
                  ? 'bg-[var(--color-danger)]'
                  : usagePercent >= (alertThresholds.warn || 75)
                    ? 'bg-[var(--color-warning)]'
                    : 'bg-[var(--color-success)]';
              const sliderMin = Math.max(
                0,
                Math.round((Number(budgetUsage[index]?.spent) || 0) * 100)
              );
              const dynamicSliderBaseline = hasGlobalBudget
                ? totalBudgetCents
                : Math.max(categoriesTotalCents, assignedCents * 2, sliderMin + 10000);
              const sliderMax = Math.max(dynamicSliderBaseline, assignedCents, sliderMin + 10000);
              const categoryKey = normalizeBudgetCategoryKey(category.name);
              const benchmarkCategory = benchmarkState.categories?.[categoryKey];
              const perGuestStats = benchmarkCategory?.perGuest;
              const showPerGuest =
                categoryKey === 'catering' &&
                perGuestStats &&
                Number(perGuestStats?.count || 0) >= 10 &&
                Number(perGuestStats?.avg || 0) > 0;
              const perGuestHint = showPerGuest
                ? t('finance.budget.perGuestHint', {
                    value: formatCurrency(perGuestStats.avg),
                    count: perGuestStats.count,
                  })
                : null;
              const sliderStep =
                sliderMax >= 5000 ? 5000 : Math.max(1, Math.round(sliderMax / 100));
              const sliderValue = Math.min(sliderMax, Math.max(sliderMin, assignedCents));
              const sliderDisabled = !onReallocateCategories;
              const sourceTag =
                typeof category.source === 'string' && category.source.toLowerCase() === 'advisor';

              return (
                <div
                  key={category.name || index}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--color-text)]/10 bg-white/85 px-3 py-2 text-[11px] shadow-sm"
                >
                  <div className="flex items-center gap-1 min-w-[150px]">
                    <span className="text-sm font-semibold text-[color:var(--color-text)]">
                      {category.name}
                    </span>
                    {perGuestHint && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {perGuestHint}
                      </span>
                    )}
                    {sourceTag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                        <Sparkles size={10} />
                        {t('finance.budget.advisor', { defaultValue: 'Consejero' })}
                      </span>
                    )}
                    {usagePercent >= 100 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-danger)]">
                        <AlertTriangle size={10} />
                        {t('finance.budget.exceeded', { defaultValue: 'Excedido' })}
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-1.5 ${sliderDisabled ? 'opacity-60' : ''}`}>
                    <input
                      type="number"
                      min={(sliderMin / 100).toFixed(2)}
                      step="0.01"
                      defaultValue={assignedAmount.toFixed(2)}
                      onBlur={(event) => {
                        const raw = parseFloat(String(event.target.value).replace(',', '.'));
                        if (Number.isNaN(raw)) {
                          event.target.value = (sliderValue / 100).toFixed(2);
                          return;
                        }
                        const cents = Math.round(raw * 100);
                        const clamped = Math.max(sliderMin, Math.min(sliderMax, cents));
                        handleAllocationChange(index, clamped);
                        event.target.value = (clamped / 100).toFixed(2);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      disabled={sliderDisabled}
                      key={`${category.name || index}-${sliderValue}`}
                      className="w-20 rounded-md border border-[color:var(--color-text)]/20 px-2 py-1 text-xs shadow-sm"
                    />
                  </div>

                  <div className={`flex flex-1 min-w-[180px] flex-col ${sliderDisabled ? 'opacity-60' : ''}`}>
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={sliderStep}
                      value={sliderValue}
                      onChange={(e) => handleAllocationChange(index, Number(e.target.value))}
                      disabled={sliderDisabled}
                      className="w-full accent-[var(--color-primary)]"
                      aria-label={`Reasignar presupuesto para ${category.name}`}
                    />
                    <div className="mt-1 h-[4px] w-full rounded-full bg-[color:var(--color-text)]/10">
                      <div
                        className={`${barColor} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-[color:var(--color-text)]/70">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={Boolean(category.muted)}
                        onChange={(e) => onUpdateCategory(index, { muted: e.target.checked })}
                      />
                      {t('finance.budget.muteShort', { defaultValue: 'Silenciar' })}
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-primary)]/40 px-2 py-1 text-[11px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
                      onClick={handleOpenAdvisor}
                      disabled={advisorLoading || localAdvisorLoading}
                    >
                      {(advisorLoading || localAdvisorLoading) ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {t('finance.budget.advisorShort', { defaultValue: 'AI' })}
                    </button>
                    <button
                      aria-label="Editar categoría"
                      onClick={() => handleEditCategory(category, index)}
                      className="text-[var(--color-primary)] hover:brightness-110 p-1"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      aria-label="Eliminar categoría"
                      onClick={() => handleDeleteCategory(index, category.name)}
                      className="text-[color:var(--color-danger)] hover:brightness-110 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </Card>

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
            <div className="flex items-center justify-center py-6 text-[color:var(--color-text)]/70">
              <Loader2 className="animate-spin mr-2" size={18} />
              Calculando recomendaciones...
            </div>
          )}

          {!advisorLoading && !localAdvisorLoading && advisorError && (
            <div className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-sm text-[color:var(--color-danger)]">
              {advisorError}
            </div>
          )}

          {!advisorLoading &&
            !localAdvisorLoading &&
            !advisorError &&
            advisorScenarios.length === 0 && (
              <div className="rounded-lg border border-dashed border-[color:var(--color-text)]/20 p-6 text-center text-sm text-[color:var(--color-text)]/70 space-y-3">
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
                    className="rounded-lg border border-[color:var(--color-text)]/15 bg-white/70 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 px-4 py-3 border-b border-[color:var(--color-text)]/10">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text)]">
                          <Sparkles className="text-[var(--color-primary)]" size={16} />
                          {scenario.label || `Escenario ${idx + 1}`}
                          {isApplied && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
                              <CheckCircle size={12} />
                              Aplicado
                            </span>
                          )}
                        </div>
                        {scenario.summary && (
                          <p className="text-sm text-[color:var(--color-text)]/70 mt-1">
                            {scenario.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-60 disabled:cursor-not-allowed"
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
                              <tr className="text-left text-[color:var(--color-text)]/60 uppercase tracking-wide text-xs">
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
                                    className="border-t border-[color:var(--color-text)]/10"
                                  >
                                    <td className="py-2 pr-4 font-medium text-[color:var(--color-text)]">
                                      {entry.category || 'Categoria'}
                                    </td>
                                    <td className="py-2 pr-4 text-[color:var(--color-text)]/80">
                                      {distribution || '—'}
                                    </td>
                                    <td className="py-2 pr-4 text-[color:var(--color-text)]/60">
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
                        <div className="rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3 space-y-2 text-xs text-[color:var(--color-text)]/80">
                          {scenario.alerts.map((alert, alertIdx) => (
                            <div key={alertIdx} className="flex items-start gap-2">
                              <AlertTriangle size={12} className="mt-0.5 text-[var(--color-warning)]" />
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
          setNewCategory({ name: '', amount: '' });
        }}
        title={
          editingCategory
            ? t('finance.budget.modal.editTitle', { defaultValue: 'Editar categoría' })
            : t('finance.budget.modal.newTitle', { defaultValue: 'Nueva categoría' })
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
              {t('finance.budget.modal.name', { defaultValue: 'Nombre de la categoría' })}
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ej: Catering, Musica, Flores..."
              className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
              Presupuesto asignado (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newCategory.amount}
              onChange={(e) => setNewCategory({ ...newCategory, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setEditingCategoryIndex(-1);
                setNewCategory({ name: '', amount: '' });
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
    </div>
  );
}

