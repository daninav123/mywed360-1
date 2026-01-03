import React, { useState, useEffect } from 'react';
import { Loader2, PieChart } from 'lucide-react';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';

export default function BudgetWizardStep3({ 
  data, 
  onUpdate, 
  t 
}) {
  const [localDistribution, setLocalDistribution] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const industryPercentages = {
    'catering': 30,
    'lugares': 22,
    'restaurantes': 20,
    'fotografia': 12,
    'video': 10,
    'musica': 8,
    'dj': 8,
    'flores-decoracion': 6,
    'decoracion': 4,
    'vestidos-trajes': 5,
    'belleza': 1.5,
    'joyeria': 3,
    'tartas': 2,
    'invitaciones': 1.5,
    'detalles': 1,
    'transporte': 1,
    'animacion': 2,
    'fuegos-artificiales': 1,
    'organizacion': 4,
    'ceremonia': 1,
    'luna-miel': 5,
  };

  useEffect(() => {
    if (data.distribution.length > 0) {
      setLocalDistribution(data.distribution);
    } else if (data.selectedServices.length > 0 && localDistribution.length === 0) {
      generateSmartDistribution();
    }
  }, [data.selectedServices]);

  const generateSmartDistribution = () => {
    console.log('[Step3] generateSmartDistribution llamado');
    console.log('[Step3] Servicios seleccionados:', data.selectedServices);
    console.log('[Step3] Total presupuesto:', data.totalBudget);
    
    const count = data.selectedServices.length;
    if (count === 0 || data.totalBudget <= 0) {
      console.warn('[Step3] Abortando: count=', count, 'budget=', data.totalBudget);
      return;
    }

    const RESERVE_PERCENTAGE = 10;
    const AVAILABLE_PERCENTAGE = 100 - RESERVE_PERCENTAGE;
    const reserveAmount = Math.round((RESERVE_PERCENTAGE / 100) * data.totalBudget * 100) / 100;
    const availableBudget = data.totalBudget - reserveAmount;

    const distribution = data.selectedServices.map(service => {
      const key = normalizeBudgetCategoryKey(service);
      let percentage = industryPercentages[key];
      
      if (!percentage) {
        const categorizedServices = data.selectedServices.filter(s => {
          const k = normalizeBudgetCategoryKey(s);
          return industryPercentages[k];
        });
        
        const usedPercentage = categorizedServices.reduce((sum, s) => {
          const k = normalizeBudgetCategoryKey(s);
          return sum + (industryPercentages[k] || 0);
        }, 0);
        
        const remainingPercentage = Math.max(0, 100 - usedPercentage);
        const unknownServicesCount = data.selectedServices.length - categorizedServices.length;
        percentage = unknownServicesCount > 0 ? remainingPercentage / unknownServicesCount : 5;
      }
      
      return {
        name: service,
        percentage,
        amount: 0,
      };
    });

    const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0);
    
    const servicesDistribution = distribution.map(item => {
      const normalizedPercentage = (item.percentage / totalPercentage) * AVAILABLE_PERCENTAGE;
      const amount = Math.round((normalizedPercentage / 100) * data.totalBudget * 100) / 100;
      
      return {
        ...item,
        percentage: Math.round(normalizedPercentage * 10) / 10,
        amount,
      };
    });

    const reserveItem = {
      name: 'Imprevistos',
      percentage: RESERVE_PERCENTAGE,
      amount: reserveAmount,
    };

    const normalizedDistribution = [...servicesDistribution, reserveItem];

    const totalAmount = normalizedDistribution.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(totalAmount - data.totalBudget) > 0.01) {
      const diff = data.totalBudget - totalAmount;
      normalizedDistribution[0].amount = Math.round((normalizedDistribution[0].amount + diff) * 100) / 100;
    }

    console.log('[Step3] Distribución generada:', normalizedDistribution);
    console.log('[Step3] Total presupuesto:', data.totalBudget);
    setLocalDistribution(normalizedDistribution);
    onUpdate({ distribution: normalizedDistribution });
  };

  const handleAmountChange = (index, newAmount) => {
    const amount = Math.max(0, parseFloat(newAmount) || 0);
    const percentage = data.totalBudget > 0 ? (amount / data.totalBudget) * 100 : 0;
    
    const updated = [...localDistribution];
    updated[index] = {
      ...updated[index],
      amount,
      percentage,
    };
    
    setLocalDistribution(updated);
    onUpdate({ distribution: updated });
  };

  const totalAllocated = localDistribution.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = data.totalBudget - totalAllocated;
  const isComplete = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-[var(--color-primary-10)] border-[color:var(--color-primary-30)]">
        <div className="flex items-start gap-3">
          <PieChart className="w-5 h-5 text-[color:var(--color-primary)] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[color:var(--color-primary)]">
              {t('finance.wizard.step3.info', { 
                defaultValue: '¡Casi listo! Ahora distribuye tu presupuesto' 
              })}
            </p>
            <p className="text-xs text-[color:var(--color-primary-80)] mt-1">
              {t('finance.wizard.step3.infoDesc', { 
                defaultValue: 'Elige cómo quieres distribuir el presupuesto entre tus servicios' 
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Reserve Info */}
      <Card className="p-3 bg-[var(--color-info-10)] border-[color:var(--color-info-30)]">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-[color:var(--color-info)]">
              {t('finance.wizard.step3.reserveInfo', { 
                defaultValue: 'Hemos reservado automáticamente el 10% para imprevistos' 
              })}
            </p>
            <p className="text-xs text-[color:var(--color-info-80)] mt-1">
              {t('finance.wizard.step3.reserveDesc', { 
                defaultValue: 'Distribución inteligente basada en estándares de la industria. Puedes ajustar los valores manualmente.' 
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-3 text-[color:var(--color-primary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">
              {t('finance.wizard.step3.generating', { defaultValue: 'Generando distribución...' })}
            </span>
          </div>
        </Card>
      )}

      {/* Distribution List */}
      {!isGenerating && localDistribution.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-body">
              {t('finance.wizard.step3.distribution', { defaultValue: 'Distribución del Presupuesto' })}
            </h4>
            <span className="text-xs text-muted">
              {t('finance.wizard.step3.totalBudget', { defaultValue: 'Total:' })} {formatCurrency(data.totalBudget)}
            </span>
          </div>

          {localDistribution.map((item, index) => (
            <Card key={item.name} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-body">{item.name}</span>
                  <span className="text-xs text-muted">
                    {item.percentage?.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount || ''}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                />
              </div>
            </Card>
          ))}

          {/* Summary */}
          <Card className={`p-4 ${
            isComplete 
              ? 'bg-[var(--color-success-10)] border-[color:var(--color-success-30)]' 
              : remaining > 0
              ? 'bg-[var(--color-warning-10)] border-[color:var(--color-warning-30)]'
              : 'bg-[var(--color-danger-10)] border-[color:var(--color-danger-30)]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {t('finance.wizard.step3.allocated', { defaultValue: 'Asignado:' })} {formatCurrency(totalAllocated)}
                </p>
                <p className={`text-xs ${
                  isComplete 
                    ? 'text-[color:var(--color-success)]' 
                    : remaining > 0
                    ? 'text-[color:var(--color-warning)]'
                    : 'text-[color:var(--color-danger)]'
                }`}>
                  {isComplete 
                    ? t('finance.wizard.step3.complete', { defaultValue: '✓ Distribución completa' })
                    : remaining > 0
                    ? t('finance.wizard.step3.remaining', { 
                        amount: formatCurrency(remaining),
                        defaultValue: `Quedan ${formatCurrency(remaining)} por asignar` 
                      })
                    : t('finance.wizard.step3.exceeded', { 
                        amount: formatCurrency(Math.abs(remaining)),
                        defaultValue: `Has excedido el presupuesto en ${formatCurrency(Math.abs(remaining))}` 
                      })
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
