import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Users, RefreshCw, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

/**
 * Configuración de aportaciones y regalos
 */
export default function ContributionSettings({ 
  contributions, 
  onUpdateContributions, 
  onLoadGuestCount, 
  isLoading 
}) {
  const { t } = useTranslations();
  const [localContributions, setLocalContributions] = useState(contributions);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    setLocalContributions(contributions || {
      initA: 0,
      initB: 0,
      monthlyA: 0,
      monthlyB: 0,
      extras: 0,
      giftPerGuest: 0,
      guestCount: 0,
    });
    setHasChanges(false);
  }, [contributions]);

  const handleChange = (field, value) => {
    const numValue = Number(value) || 0;
    setLocalContributions(prev => ({ ...prev, [field]: numValue }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateContributions(localContributions);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalContributions(contributions);
    setHasChanges(false);
  };

  // Cálculos en tiempo real
  const monthlyTotal = localContributions.monthlyA + localContributions.monthlyB;
  const initialTotal = localContributions.initA + localContributions.initB;
  const expectedGifts = localContributions.giftPerGuest * localContributions.guestCount;
  const totalExpectedIncome = initialTotal + monthlyTotal + localContributions.extras + expectedGifts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">{t('finance.contributions.title', { defaultValue: 'Configuración de Aportaciones' })}</h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            {t('finance.contributions.subtitle', { defaultValue: 'Configura las aportaciones y estima los ingresos esperados' })}
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw size={16} />}
          onClick={onLoadGuestCount}
          disabled={isLoading}
        >
          {t('finance.contributions.updateGuests', { defaultValue: 'Actualizar Invitados' })}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de configuración */}
        <div className="space-y-6">
          {/* Aportaciones iniciales */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">
              {t('finance.contributions.initial.title', { defaultValue: 'Aportaciones Iniciales' })}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.initial.personA', { defaultValue: 'Persona A (€)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.initA}
                  onChange={(e) => handleChange('initA', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.initial.personB', { defaultValue: 'Persona B (€)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.initB}
                  onChange={(e) => handleChange('initB', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-2 border-t border-[color:var(--color-text)]/10">
                <p className="text-sm text-[color:var(--color-text)]/70">
                  {t('finance.contributions.initial.total', { defaultValue: 'Total inicial:' })} <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(initialTotal)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Aportaciones mensuales */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">
              {t('finance.contributions.monthly.title', { defaultValue: 'Aportaciones Mensuales' })}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.monthly.personA', { defaultValue: 'Persona A (€/mes)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.monthlyA}
                  onChange={(e) => handleChange('monthlyA', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.monthly.personB', { defaultValue: 'Persona B (€/mes)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.monthlyB}
                  onChange={(e) => handleChange('monthlyB', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-2 border-t border-[color:var(--color-text)]/10">
                <p className="text-sm text-[color:var(--color-text)]/70">
                  {t('finance.contributions.monthly.total', { defaultValue: 'Total mensual:' })} <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(monthlyTotal)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Aportaciones extras */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">
              {t('finance.contributions.extras.title', { defaultValue: 'Aportaciones Extras' })}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.extras.totalLabel', { defaultValue: 'Total extras (familia, otros ingresos) (€)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.extras}
                  onChange={(e) => handleChange('extras', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-[color:var(--color-text)]/60">
                  {t('finance.contributions.extras.help', { defaultValue: 'Incluye regalos de familia, aportaciones de padres, etc.' })}
                </p>
              </div>
            </div>
          </Card>

          {/* Estimación de regalos */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">
              {t('finance.contributions.gifts.title', { defaultValue: 'Estimación de Regalos' })}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.gifts.giftPerGuest', { defaultValue: 'Regalo estimado por invitado (€)' })}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={localContributions.giftPerGuest}
                  onChange={(e) => handleChange('giftPerGuest', e.target.value)}
                  className="w-full px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
                  {t('finance.contributions.gifts.guestCount', { defaultValue: 'Número de invitados' })}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={localContributions.guestCount}
                    onChange={(e) => handleChange('guestCount', e.target.value)}
                    className="flex-1 px-3 py-2 border border-[color:var(--color-text)]/20 rounded-md focus:ring-2  focus:border-transparent"
                    placeholder="0"
                  />
                  <Button
                    variant="outline"
                    onClick={onLoadGuestCount}
                    disabled={isLoading}
                    className="px-3"
                  >
                    <Users size={16} />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-text)]/60">
                  {t('finance.contributions.gifts.loadHint', { defaultValue: 'Haz clic en el icono para cargar automáticamente desde tu lista de invitados' })}
                </p>
              </div>
              <div className="pt-2 border-t border-[color:var(--color-text)]/10">
                <p className="text-sm text-[color:var(--color-text)]/70">
                  {t('finance.contributions.gifts.total', { defaultValue: 'Total estimado en regalos:' })} <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(expectedGifts)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Botones de acción */}
          {hasChanges && (
            <Card className="p-4 bg-[var(--color-primary)]/10 border-blue-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-[var(--color-primary)]">
                  {t('finance.contributions.unsaved', { defaultValue: 'Tienes cambios sin guardar' })}
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {t('app.cancel', { defaultValue: 'Cancelar' })}
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    {t('finance.contributions.saveChanges', { defaultValue: 'Guardar Cambios' })}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Resumen y proyecciones */}
        <div className="space-y-6">
          {/* Resumen de ingresos esperados */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-[var(--color-success)]/15 rounded-full">
                <Calculator className="w-5 h-5 text-[color:var(--color-success)]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[color:var(--color-text)]">
                  {t('finance.contributions.summary.title', { defaultValue: 'Resumen de Ingresos Esperados' })}
                </h3>
                <p className="text-sm text-[color:var(--color-text)]/70">
                  {t('finance.contributions.summary.subtitle', { defaultValue: 'Proyección total basada en tus configuraciones' })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[color:var(--color-text)]/10">
                <span className="text-sm text-[color:var(--color-text)]/70">{t('finance.contributions.summary.initial', { defaultValue: 'Aportaciones iniciales' })}</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(initialTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[color:var(--color-text)]/10">
                <span className="text-sm text-[color:var(--color-text)]/70">{t('finance.contributions.summary.monthly', { defaultValue: 'Aportaciones mensuales' })}</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(monthlyTotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[color:var(--color-text)]/10">
                <span className="text-sm text-[color:var(--color-text)]/70">{t('finance.contributions.summary.extras', { defaultValue: 'Aportaciones extras' })}</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(localContributions.extras)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[color:var(--color-text)]/10">
                <span className="text-sm text-[color:var(--color-text)]/70">{t('finance.contributions.summary.gifts', { defaultValue: 'Regalos estimados' })}</span>
                <span className="font-medium text-[color:var(--color-text)]">{formatCurrency(expectedGifts)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="font-medium text-green-800">{t('finance.contributions.summary.total', { defaultValue: 'Total Esperado' })}</span>
                <span className="text-xl font-bold text-[color:var(--color-success)]">{formatCurrency(totalExpectedIncome)}</span>
              </div>
            </div>
          </Card>

          {/* Consejos y recomendaciones */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">
              {t('finance.contributions.tips.title', { defaultValue: 'Consejos Financieros' })}
            </h3>
            <div className="space-y-3 text-sm text-[color:var(--color-text)]/70">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[var(--color-primary)]/100 rounded-full mt-2"></div>
                <p>
                  <strong>{t('finance.contributions.tips.emergencyTitle', { defaultValue: 'Fondo de emergencia:' })}</strong> {t('finance.contributions.tips.emergencyText', { defaultValue: 'Considera reservar un 10-15% del presupuesto total para gastos imprevistos.' })}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[var(--color-primary)]/100 rounded-full mt-2"></div>
                <p>
                  <strong>{t('finance.contributions.tips.giftsTitle', { defaultValue: 'Regalos conservadores:' })}</strong> {t('finance.contributions.tips.giftsText', { defaultValue: 'Es mejor subestimar los regalos de boda que sobreestimarlos.' })}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[var(--color-primary)]/100 rounded-full mt-2"></div>
                <p>
                  <strong>{t('finance.contributions.tips.reviewTitle', { defaultValue: 'Seguimiento regular:' })}</strong> {t('finance.contributions.tips.reviewText', { defaultValue: 'Revisa y actualiza estas proyecciones mensualmente.' })}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[var(--color-primary)]/100 rounded-full mt-2"></div>
                <p>
                  <strong>{t('finance.contributions.tips.balanceTitle', { defaultValue: 'Aportaciones equilibradas:' })}</strong> {t('finance.contributions.tips.balanceText', { defaultValue: 'Mantén un balance justo entre las aportaciones de ambas personas.' })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
