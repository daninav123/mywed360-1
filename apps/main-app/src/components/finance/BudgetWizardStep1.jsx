import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';

export default function BudgetWizardStep1({ data, onUpdate, contributions, t }) {
  const [monthsUntilWedding, setMonthsUntilWedding] = useState(12);
  const [editableContributions, setEditableContributions] = useState({
    initA: contributions?.initA || 0,
    initB: contributions?.initB || 0,
    monthlyA: contributions?.monthlyA || 0,
    monthlyB: contributions?.monthlyB || 0,
    extras: contributions?.extras || 0,
    giftPerGuest: contributions?.giftPerGuest || 0,
  });

  useEffect(() => {
    setEditableContributions({
      initA: contributions?.initA || 0,
      initB: contributions?.initB || 0,
      monthlyA: contributions?.monthlyA || 0,
      monthlyB: contributions?.monthlyB || 0,
      extras: contributions?.extras || 0,
      giftPerGuest: contributions?.giftPerGuest || 0,
    });
  }, [contributions]);

  useEffect(() => {
    calculateTotalIncome();
  }, [editableContributions, monthsUntilWedding, data.guestCount]);

  const calculateTotalIncome = () => {
    const initA = editableContributions.initA || 0;
    const initB = editableContributions.initB || 0;
    const monthlyA = editableContributions.monthlyA || 0;
    const monthlyB = editableContributions.monthlyB || 0;
    const extras = editableContributions.extras || 0;
    const giftPerGuest = editableContributions.giftPerGuest || 0;
    const guestCount = data.guestCount || 0;

    const initialContributions = initA + initB;
    const monthlyContributions = (monthlyA + monthlyB) * monthsUntilWedding;
    const estimatedGifts = giftPerGuest * guestCount;
    const totalIncome = initialContributions + monthlyContributions + extras + estimatedGifts;

    onUpdate({ 
      totalBudget: totalIncome,
      incomeBreakdown: {
        initialContributions,
        monthlyContributions,
        extras,
        estimatedGifts,
      }
    });
  };

  const handleContributionChange = (field, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setEditableContributions(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleGuestCountChange = (value) => {
    const count = Math.max(0, parseInt(value) || 0);
    onUpdate({ guestCount: count });
  };

  const handleMonthsChange = (value) => {
    setMonthsUntilWedding(Math.max(1, parseInt(value) || 1));
  };

  const quickMonths = [6, 12, 18, 24];

  const incomeBreakdown = data.incomeBreakdown || {
    initialContributions: 0,
    monthlyContributions: 0,
    extras: 0,
    estimatedGifts: 0,
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-[var(--color-primary-10)] border-[color:var(--color-primary-30)]">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-[color:var(--color-primary)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[color:var(--color-primary)]">
              {t('finance.wizard.step1.info', { 
                defaultValue: '¡Comencemos! Vamos a calcular tus ingresos totales' 
              })}
            </p>
            <p className="text-xs text-[color:var(--color-primary-80)] mt-1">
              {t('finance.wizard.step1.infoDesc', { 
                defaultValue: 'Basado en tus aportaciones iniciales, mensuales, extras y estimación de regalos' 
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Configuration Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest Count */}
        <div>
          <label className="block text-sm font-semibold text-body mb-2">
            {t('finance.wizard.step1.guestCount', { defaultValue: 'Número de Invitados' })}
          </label>
          <input
            type="number"
            min="0"
            value={data.guestCount || ''}
            onChange={(e) => handleGuestCountChange(e.target.value)}
            placeholder="Ej: 100"
            className="w-full px-4 py-3 border-2 border-[color:var(--color-text-20)] rounded-lg focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] text-lg"
          />
          <p className="text-xs text-muted mt-1">
            {t('finance.wizard.step1.guestCountDesc', { 
              defaultValue: 'Para estimar los regalos' 
            })}
          </p>
        </div>

        {/* Months Until Wedding */}
        <div>
          <label className="block text-sm font-semibold text-body mb-2">
            {t('finance.wizard.step1.monthsUntilWedding', { defaultValue: 'Meses hasta la Boda' })}
          </label>
          <input
            type="number"
            min="1"
            value={monthsUntilWedding}
            onChange={(e) => handleMonthsChange(e.target.value)}
            placeholder="Ej: 12"
            className="w-full px-4 py-3 border-2 border-[color:var(--color-text-20)] rounded-lg focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)] text-lg"
          />
          <div className="flex gap-2 mt-2">
            {quickMonths.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setMonthsUntilWedding(months)}
                className="px-3 py-1 text-xs rounded-md bg-[var(--color-primary-10)] text-[color:var(--color-primary)] hover:bg-[var(--color-primary-20)] transition-colors"
              >
                {months}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Contributions */}
      <Card className="p-4 bg-[var(--color-surface)]">
        <h4 className="text-sm font-semibold text-body mb-3">
          {t('finance.wizard.step1.contributions', { defaultValue: 'Aportaciones (editables)' })}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.initA', { defaultValue: 'Aportación Inicial A' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.initA || ''}
              onChange={(e) => handleContributionChange('initA', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.initB', { defaultValue: 'Aportación Inicial B' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.initB || ''}
              onChange={(e) => handleContributionChange('initB', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.monthlyA', { defaultValue: 'Aportación Mensual A' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.monthlyA || ''}
              onChange={(e) => handleContributionChange('monthlyA', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.monthlyB', { defaultValue: 'Aportación Mensual B' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.monthlyB || ''}
              onChange={(e) => handleContributionChange('monthlyB', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.extras', { defaultValue: 'Aportaciones Extras' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.extras || ''}
              onChange={(e) => handleContributionChange('extras', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              {t('finance.wizard.step1.giftPerGuest', { defaultValue: 'Regalo por Invitado' })}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editableContributions.giftPerGuest || ''}
              onChange={(e) => handleContributionChange('giftPerGuest', e.target.value)}
              className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
            />
          </div>
        </div>
      </Card>

      {/* Income Summary */}
      <Card className="p-4 bg-[var(--color-primary-10)] border-[color:var(--color-primary-30)]">
        <h4 className="text-sm font-semibold text-[color:var(--color-primary)] mb-3">
          {t('finance.wizard.step1.summary', { defaultValue: 'Resumen de Ingresos' })}
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[color:var(--color-primary-80)]">
              {t('finance.wizard.step1.initialContributions', { defaultValue: 'Aportaciones Iniciales' })}
            </span>
            <span className="font-medium text-[color:var(--color-primary)]">
              {formatCurrency(incomeBreakdown.initialContributions)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[color:var(--color-primary-80)]">
              {t('finance.wizard.step1.monthlyContributions', { defaultValue: 'Aportaciones Mensuales' })} ({monthsUntilWedding}m)
            </span>
            <span className="font-medium text-[color:var(--color-primary)]">
              {formatCurrency(incomeBreakdown.monthlyContributions)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[color:var(--color-primary-80)]">
              {t('finance.wizard.step1.extras', { defaultValue: 'Aportaciones Extras' })}
            </span>
            <span className="font-medium text-[color:var(--color-primary)]">
              {formatCurrency(incomeBreakdown.extras)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[color:var(--color-primary-80)]">
              {t('finance.wizard.step1.estimatedGifts', { defaultValue: 'Regalos Estimados' })}
            </span>
            <span className="font-medium text-[color:var(--color-primary)]">
              {formatCurrency(incomeBreakdown.estimatedGifts)}
            </span>
          </div>
          <div className="h-px bg-[var(--color-primary-20)] my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[color:var(--color-primary)]">
              {t('finance.wizard.step1.totalIncome', { defaultValue: 'Ingresos Totales' })}
            </span>
            <span className="text-lg font-bold text-[color:var(--color-primary)]">
              {formatCurrency(data.totalBudget || 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Note about modifying contributions */}
      <Card className="p-3 bg-[var(--color-warning-10)] border-[color:var(--color-warning-30)]">
        <p className="text-xs text-[color:var(--color-warning)]">
          💡 {t('finance.wizard.step1.contributionsNote', { 
            defaultValue: 'Puedes modificar tus aportaciones en la pestaña "Aportaciones" después de completar este asistente' 
          })}
        </p>
      </Card>
    </div>
  );
}
