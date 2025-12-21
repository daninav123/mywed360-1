import React, { useState } from 'react';
import { PlusCircle, MinusCircle, X } from 'lucide-react';
import { Button } from '../ui';
import Modal from '../Modal';
import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Modal para ajustar el saldo manualmente
 * Útil para corregir gastos/ingresos fuera del sistema
 */
export default function BalanceAdjustmentModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentBalance = 0,
  adjustments = []
}) {
  const { t } = useTranslations();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('positive'); // 'positive' | 'negative'
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError(t('finance.adjustments.errorAmount', { defaultValue: 'Introduce un importe válido' }));
      return;
    }

    if (!reason.trim()) {
      setError(t('finance.adjustments.errorReason', { defaultValue: 'Introduce un motivo' }));
      return;
    }

    const finalAmount = type === 'negative' ? -numAmount : numAmount;
    
    onSave({
      amount: finalAmount,
      reason: reason.trim(),
      date: new Date().toISOString(),
    });

    // Reset form
    setAmount('');
    setReason('');
    setType('positive');
    setError('');
  };

  const handleCancel = () => {
    setAmount('');
    setReason('');
    setType('positive');
    setError('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title={t('finance.adjustments.title', { defaultValue: 'Ajustar Saldo' })}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Saldo Actual */}
        <div className="bg-[var(--color-text-5)] rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {t('finance.adjustments.currentBalance', { defaultValue: 'Saldo actual' })}
          </p>
          <p className="text-2xl font-bold text-body">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        {/* Tipo de Ajuste */}
        <div>
          <label className="block text-sm font-medium text-body mb-2">
            {t('finance.adjustments.typeLabel', { defaultValue: 'Tipo de ajuste' })}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('positive')}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'positive'
                  ? 'border-[color:var(--color-success)] bg-[var(--color-success-10)]'
                  : 'border-[color:var(--color-text-20)] bg-[var(--color-surface)]'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <PlusCircle 
                  className={`w-5 h-5 ${type === 'positive' ? 'text-[color:var(--color-success)]' : 'text-muted'}`} 
                />
                <span className={`font-medium ${type === 'positive' ? 'text-[color:var(--color-success)]' : 'text-body'}`}>
                  {t('finance.adjustments.increase', { defaultValue: 'Aumentar' })}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('negative')}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === 'negative'
                  ? 'border-[color:var(--color-danger)] bg-[var(--color-danger-10)]'
                  : 'border-[color:var(--color-text-20)] bg-[var(--color-surface)]'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <MinusCircle 
                  className={`w-5 h-5 ${type === 'negative' ? 'text-[color:var(--color-danger)]' : 'text-muted'}`} 
                />
                <span className={`font-medium ${type === 'negative' ? 'text-[color:var(--color-danger)]' : 'text-body'}`}>
                  {t('finance.adjustments.decrease', { defaultValue: 'Disminuir' })}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Importe */}
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('finance.adjustments.amount', { defaultValue: 'Importe (€)' })}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:border-transparent"
            placeholder="0.00"
            autoFocus
          />
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('finance.adjustments.reason', { defaultValue: 'Motivo del ajuste' })}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:border-transparent resize-none"
            rows="3"
            placeholder={t('finance.adjustments.reasonPlaceholder', { 
              defaultValue: 'Ej: Gasto en efectivo no registrado, error de cálculo, etc.' 
            })}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[var(--color-danger-10)] border border-[color:var(--color-danger-30)] rounded-lg p-3">
            <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
          </div>
        )}

        {/* Vista previa del nuevo saldo */}
        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
          <div className="bg-[var(--color-primary-10)] border border-[color:var(--color-primary-30)] rounded-lg p-4">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">
              {t('finance.adjustments.newBalance', { defaultValue: 'Nuevo saldo' })}
            </p>
            <p className="text-2xl font-bold text-[color:var(--color-primary)]">
              {formatCurrency(
                currentBalance + (type === 'negative' ? -parseFloat(amount) : parseFloat(amount))
              )}
            </p>
          </div>
        )}

        {/* Historial reciente */}
        {adjustments && adjustments.length > 0 && (
          <div className="border-t border-soft pt-4">
            <p className="text-sm font-medium text-body mb-3">
              {t('finance.adjustments.recentHistory', { defaultValue: 'Últimos ajustes' })}
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {adjustments.slice(-3).reverse().map((adj, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-[var(--color-text-5)] rounded">
                  <span className="text-muted text-xs">
                    {new Date(adj.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className={`font-medium ${adj.amount >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
                    {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-soft">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t('app.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button type="submit">
            {t('finance.adjustments.saveAdjustment', { defaultValue: 'Guardar Ajuste' })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
