import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Users } from 'lucide-react';
import Modal from '../Modal';
import { Card, Button } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';

export default function BudgetRebalanceModal({
  open,
  onClose,
  categoryName,
  oldAmount,
  newAmount,
  categories,
  totalBudget,
  onApply,
  t,
}) {
  const [selectedMode, setSelectedMode] = useState('imprevistos');
  const [manualSelection, setManualSelection] = useState({});
  
  const difference = newAmount - oldAmount;
  const currentTotal = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
  const totalAfterChange = currentTotal - oldAmount + newAmount;
  const needsReduction = totalAfterChange > totalBudget;
  const amountToReduce = totalAfterChange - totalBudget;

  const otherCategories = categories.filter(cat => cat.name !== categoryName);
  const imprevistosCategory = otherCategories.find(cat => cat.name === 'Imprevistos');
  const canUseImprevistos = imprevistosCategory && imprevistosCategory.amount >= amountToReduce;

  useEffect(() => {
    if (canUseImprevistos) {
      setSelectedMode('imprevistos');
    } else if (otherCategories.length > 0) {
      setSelectedMode('proportional');
    } else {
      setSelectedMode('increase');
    }
  }, [canUseImprevistos, otherCategories.length]);

  useEffect(() => {
    if (selectedMode === 'manual') {
      const initial = {};
      otherCategories.forEach(cat => {
        initial[cat.name] = 0;
      });
      setManualSelection(initial);
    }
  }, [selectedMode]);

  const handleManualChange = (catName, value) => {
    const amount = Math.max(0, parseFloat(value) || 0);
    setManualSelection(prev => ({
      ...prev,
      [catName]: amount,
    }));
  };

  const getTotalManualReduction = () => {
    return Object.values(manualSelection).reduce((sum, val) => sum + val, 0);
  };

  const getProportionalReduction = () => {
    const totalOthers = otherCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
    if (totalOthers === 0) return [];

    return otherCategories.map(cat => ({
      name: cat.name,
      currentAmount: cat.amount,
      reduction: (cat.amount / totalOthers) * amountToReduce,
      newAmount: cat.amount - (cat.amount / totalOthers) * amountToReduce,
    }));
  };

  const handleApply = () => {
    let rebalancedCategories = [...categories];

    const categoryIndex = rebalancedCategories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex >= 0) {
      rebalancedCategories[categoryIndex] = {
        ...rebalancedCategories[categoryIndex],
        amount: newAmount,
      };
    }

    if (needsReduction) {
      if (selectedMode === 'imprevistos' && imprevistosCategory) {
        const imprevistosIndex = rebalancedCategories.findIndex(cat => cat.name === 'Imprevistos');
        if (imprevistosIndex >= 0) {
          rebalancedCategories[imprevistosIndex] = {
            ...rebalancedCategories[imprevistosIndex],
            amount: Math.max(0, imprevistosCategory.amount - amountToReduce),
          };
        }
      } else if (selectedMode === 'proportional') {
        const proportional = getProportionalReduction();
        proportional.forEach(item => {
          const idx = rebalancedCategories.findIndex(cat => cat.name === item.name);
          if (idx >= 0) {
            rebalancedCategories[idx] = {
              ...rebalancedCategories[idx],
              amount: Math.max(0, Math.round(item.newAmount * 100) / 100),
            };
          }
        });
      } else if (selectedMode === 'manual') {
        Object.entries(manualSelection).forEach(([catName, reduction]) => {
          const idx = rebalancedCategories.findIndex(cat => cat.name === catName);
          if (idx >= 0 && reduction > 0) {
            rebalancedCategories[idx] = {
              ...rebalancedCategories[idx],
              amount: Math.max(0, rebalancedCategories[idx].amount - reduction),
            };
          }
        });
      }
    }

    onApply(rebalancedCategories);
    onClose();
  };

  const isManualValid = selectedMode !== 'manual' || Math.abs(getTotalManualReduction() - amountToReduce) < 0.01;

  if (!needsReduction) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)]" />
          <span>{t('finance.rebalance.title', { defaultValue: 'Ajustar Presupuesto' })}</span>
        </div>
      }
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Info */}
        <Card className="p-4 bg-[var(--color-warning-10)] border-[color:var(--color-warning-30)]">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[color:var(--color-warning)]">
              {t('finance.rebalance.exceeded', { 
                defaultValue: `Has aumentado "${categoryName}" de ${formatCurrency(oldAmount)} a ${formatCurrency(newAmount)}` 
              })}
            </p>
            <div className="flex justify-between text-[color:var(--color-warning-80)]">
              <span>{t('finance.rebalance.difference', { defaultValue: 'Diferencia:' })}</span>
              <span className="font-bold">+{formatCurrency(amountToReduce)}</span>
            </div>
            <div className="flex justify-between text-[color:var(--color-warning-80)]">
              <span>{t('finance.rebalance.total', { defaultValue: 'Total presupuesto:' })}</span>
              <span className="font-bold">{formatCurrency(totalBudget)}</span>
            </div>
          </div>
        </Card>

        {/* Options */}
        <div>
          <h4 className="text-sm font-semibold text-body mb-3">
            {t('finance.rebalance.howToAdjust', { defaultValue: '¿De dónde reducir?' })}
          </h4>

          <div className="space-y-2">
            {/* Imprevistos option */}
            {canUseImprevistos && (
              <button
                type="button"
                onClick={() => setSelectedMode('imprevistos')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedMode === 'imprevistos'
                    ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-10)]'
                    : 'border-[color:var(--color-text-20)] hover:border-[color:var(--color-primary-30)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === 'imprevistos' 
                        ? 'border-[color:var(--color-primary)] bg-[var(--color-primary)]' 
                        : 'border-[color:var(--color-text-30)]'
                    }`}>
                      {selectedMode === 'imprevistos' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body">
                      {t('finance.rebalance.fromImprevistos', { defaultValue: 'Solo de Imprevistos (Recomendado)' })}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Imprevistos: {formatCurrency(imprevistosCategory.amount)} → {formatCurrency(imprevistosCategory.amount - amountToReduce)}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Proportional option */}
            {otherCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMode('proportional')}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedMode === 'proportional'
                    ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-10)]'
                    : 'border-[color:var(--color-text-20)] hover:border-[color:var(--color-primary-30)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === 'proportional' 
                        ? 'border-[color:var(--color-primary)] bg-[var(--color-primary)]' 
                        : 'border-[color:var(--color-text-30)]'
                    }`}>
                      {selectedMode === 'proportional' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body">
                      {t('finance.rebalance.proportional', { defaultValue: 'Distribuir entre todas proporcionalmente' })}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      -{formatCurrency(amountToReduce / otherCategories.length)} aprox. de cada categoría
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Manual option */}
            <button
              type="button"
              onClick={() => setSelectedMode('manual')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedMode === 'manual'
                  ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-10)]'
                  : 'border-[color:var(--color-text-20)] hover:border-[color:var(--color-primary-30)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'manual' 
                      ? 'border-[color:var(--color-primary)] bg-[var(--color-primary)]' 
                      : 'border-[color:var(--color-text-30)]'
                  }`}>
                    {selectedMode === 'manual' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-body">
                    {t('finance.rebalance.manual', { defaultValue: 'Elegir manualmente' })}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Selecciona de qué categorías reducir
                  </p>
                </div>
              </div>
            </button>

            {/* Increase budget option */}
            <button
              type="button"
              onClick={() => setSelectedMode('increase')}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedMode === 'increase'
                  ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-10)]'
                  : 'border-[color:var(--color-text-20)] hover:border-[color:var(--color-primary-30)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMode === 'increase' 
                      ? 'border-[color:var(--color-primary)] bg-[var(--color-primary)]' 
                      : 'border-[color:var(--color-text-30)]'
                  }`}>
                    {selectedMode === 'increase' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-body">
                    {t('finance.rebalance.increaseBudget', { defaultValue: 'Aumentar presupuesto total' })}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Nuevo total: {formatCurrency(totalAfterChange)}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Manual selection details */}
        {selectedMode === 'manual' && (
          <Card className="p-4 bg-[var(--color-surface)]">
            <h5 className="text-sm font-semibold text-body mb-3">
              {t('finance.rebalance.selectCategories', { defaultValue: 'Selecciona de dónde reducir' })}
            </h5>
            <div className="space-y-3">
              {otherCategories.map(cat => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-body">{cat.name}</p>
                    <p className="text-xs text-muted">Disponible: {formatCurrency(cat.amount)}</p>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      max={cat.amount}
                      step="0.01"
                      value={manualSelection[cat.name] || ''}
                      onChange={(e) => handleManualChange(cat.name, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[color:var(--color-text-10)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-body">
                    {t('finance.rebalance.totalReduction', { defaultValue: 'Total a reducir:' })}
                  </span>
                  <span className={`text-sm font-bold ${
                    isManualValid ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
                  }`}>
                    {formatCurrency(getTotalManualReduction())} / {formatCurrency(amountToReduce)}
                  </span>
                </div>
                {!isManualValid && (
                  <p className="text-xs text-[color:var(--color-danger)] mt-1">
                    Debe sumar exactamente {formatCurrency(amountToReduce)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Proportional preview */}
        {selectedMode === 'proportional' && (
          <Card className="p-4 bg-[var(--color-surface)]">
            <h5 className="text-sm font-semibold text-body mb-3">
              {t('finance.rebalance.preview', { defaultValue: 'Vista previa' })}
            </h5>
            <div className="space-y-2">
              {getProportionalReduction().map(item => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <span className="text-muted">{item.name}</span>
                  <span className="font-medium text-body">
                    {formatCurrency(item.currentAmount)} → {formatCurrency(item.newAmount)}
                    <span className="text-[color:var(--color-danger)] ml-2">
                      (-{formatCurrency(item.reduction)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-[color:var(--color-text-10)]">
          <Button variant="outline" onClick={onClose}>
            {t('finance.rebalance.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button 
            onClick={handleApply}
            disabled={selectedMode === 'manual' && !isManualValid}
          >
            {t('finance.rebalance.apply', { defaultValue: 'Aplicar Cambios' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
