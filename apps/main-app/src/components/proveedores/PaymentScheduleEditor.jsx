import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Percent, DollarSign, Info, AlertCircle, Save } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatUtils';

const SCHEDULE_TEMPLATES = {
  standard: {
    name: 'Estándar (25-50-25)',
    description: '25% reserva, 50% un mes antes, 25% día de la boda',
    installments: [
      { percentage: 25, description: 'Reserva', daysBeforeWedding: null },
      { percentage: 50, description: 'Un mes antes', daysBeforeWedding: 30 },
      { percentage: 25, description: 'Día de la boda', daysBeforeWedding: 0 }
    ]
  },
  split: {
    name: 'Fraccionado (50-50)',
    description: '50% reserva, 50% día de la boda',
    installments: [
      { percentage: 50, description: 'Reserva', daysBeforeWedding: null },
      { percentage: 50, description: 'Día de la boda', daysBeforeWedding: 0 }
    ]
  },
  full: {
    name: 'Pago único',
    description: '100% en una sola fecha',
    installments: [
      { percentage: 100, description: 'Pago completo', daysBeforeWedding: null }
    ]
  },
  custom: {
    name: 'Personalizado',
    description: 'Define tu propio plan de pagos',
    installments: []
  }
};

/**
 * Editor para definir plan de pagos de un proveedor
 * @param {Object} props
 * @param {number} props.totalAmount - Monto total del servicio
 * @param {Array} props.schedule - Plan de pagos actual
 * @param {Date|string} props.weddingDate - Fecha de la boda
 * @param {Function} props.onSave - Callback al guardar (schedule) => void
 * @param {Function} props.onCancel - Callback al cancelar
 */
export default function PaymentScheduleEditor({ 
  totalAmount = 0, 
  schedule = [], 
  weddingDate,
  onSave, 
  onCancel 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [installments, setInstallments] = useState([]);

  // Inicializar desde schedule existente
  useEffect(() => {
    if (schedule && schedule.length > 0) {
      setInstallments(schedule.map(item => ({
        id: item.id || `inst-${Date.now()}-${Math.random()}`,
        percentage: item.percentage || 0,
        amount: item.amount || 0,
        dueDate: item.dueDate || '',
        description: item.description || '',
        status: item.status || 'pending'
      })));
    } else {
      // Si no hay schedule, usar template estándar
      applyTemplate('standard');
    }
  }, []);

  const weddingDateObj = useMemo(() => {
    if (!weddingDate) return null;
    try {
      return new Date(weddingDate);
    } catch {
      return null;
    }
  }, [weddingDate]);

  const applyTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = SCHEDULE_TEMPLATES[templateKey];
    
    if (templateKey === 'custom' || !template) {
      setInstallments([{
        id: `inst-${Date.now()}`,
        percentage: 100,
        amount: totalAmount,
        dueDate: '',
        description: 'Pago',
        status: 'pending'
      }]);
      return;
    }

    const newInstallments = template.installments.map((item, index) => {
      const amount = Math.round((item.percentage / 100) * totalAmount * 100) / 100;
      let dueDate = '';
      
      if (weddingDateObj && item.daysBeforeWedding !== null) {
        const date = new Date(weddingDateObj);
        date.setDate(date.getDate() - item.daysBeforeWedding);
        dueDate = date.toISOString().split('T')[0];
      }

      return {
        id: `inst-${Date.now()}-${index}`,
        percentage: item.percentage,
        amount,
        dueDate,
        description: item.description,
        status: 'pending'
      };
    });

    setInstallments(newInstallments);
  };

  const addInstallment = () => {
    setInstallments([...installments, {
      id: `inst-${Date.now()}`,
      percentage: 0,
      amount: 0,
      dueDate: '',
      description: '',
      status: 'pending'
    }]);
  };

  const removeInstallment = (id) => {
    setInstallments(installments.filter(item => item.id !== id));
  };

  const updateInstallment = (id, field, value) => {
    setInstallments(installments.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Si cambia el porcentaje, recalcular monto
      if (field === 'percentage') {
        const percentage = parseFloat(value) || 0;
        updated.amount = Math.round((percentage / 100) * totalAmount * 100) / 100;
      }
      
      // Si cambia el monto, recalcular porcentaje
      if (field === 'amount') {
        const amount = parseFloat(value) || 0;
        updated.percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100 * 100) / 100 : 0;
      }
      
      return updated;
    }));
  };

  const totalPercentage = useMemo(() => {
    return installments.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
  }, [installments]);

  const totalScheduled = useMemo(() => {
    return installments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [installments]);

  const isValid = useMemo(() => {
    if (installments.length === 0) return false;
    
    // Verificar que todos los installments tengan fecha y descripción
    const allComplete = installments.every(item => 
      item.dueDate && item.description && item.amount > 0
    );
    
    // Permitir una diferencia de 1% por redondeos
    const percentageOk = Math.abs(totalPercentage - 100) < 1;
    
    return allComplete && percentageOk;
  }, [installments, totalPercentage]);

  const handleSave = () => {
    if (!isValid) return;
    onSave(installments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-xl font-bold text-[color:var(--color-text)]">
            Plan de Pagos
          </h2>
          <p className="text-sm text-[color:var(--color-text-60)] mt-1">
            Define cuándo y cuánto debes pagar a este proveedor
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resumen */}
          <Card className="bg-[var(--color-primary-10)] border-[var(--color-primary)]">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[color:var(--color-primary)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-[color:var(--color-text)] mb-2">
                  Monto total: {formatCurrency(totalAmount)}
                </h3>
                <p className="text-sm text-[color:var(--color-text-75)]">
                  Este plan de pagos se sincronizará automáticamente con tu página de Finanzas.
                  Recibirás alertas si no tienes saldo suficiente para las fechas programadas.
                </p>
              </div>
            </div>
          </Card>

          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-3">
              Plantillas de pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(SCHEDULE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedTemplate === key
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-10)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary-50)]'
                  }`}
                >
                  <h4 className="font-semibold text-sm text-[color:var(--color-text)]">
                    {template.name}
                  </h4>
                  <p className="text-xs text-[color:var(--color-text-60)] mt-1">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Installments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
                Cuotas de pago
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addInstallment}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Añadir cuota
              </Button>
            </div>

            <div className="space-y-3">
              {installments.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Descripción */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-[color:var(--color-text-60)] mb-1">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateInstallment(item.id, 'description', e.target.value)}
                        placeholder="ej: Reserva"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] text-sm"
                      />
                    </div>

                    {/* Porcentaje */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[color:var(--color-text-60)] mb-1">
                        Porcentaje
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.percentage}
                          onChange={(e) => updateInstallment(item.id, 'percentage', e.target.value)}
                          className="w-full px-3 py-2 pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] text-sm"
                        />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-text-40)]" />
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-[color:var(--color-text-60)] mb-1">
                        Monto
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateInstallment(item.id, 'amount', e.target.value)}
                          className="w-full px-3 py-2 pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] text-sm"
                        />
                        <DollarSign className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-text-40)]" />
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-[color:var(--color-text-60)] mb-1">
                        Fecha de pago
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => updateInstallment(item.id, 'dueDate', e.target.value)}
                          className="w-full px-3 py-2 pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-text)] text-sm"
                        />
                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-text-40)] pointer-events-none" />
                      </div>
                    </div>

                    {/* Eliminar */}
                    <div className="md:col-span-1 flex items-end">
                      <button
                        onClick={() => removeInstallment(item.id)}
                        disabled={installments.length === 1}
                        className="w-full md:w-auto p-2 rounded-lg hover:bg-[var(--color-danger-10)] text-[color:var(--color-danger)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Eliminar cuota"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Validación */}
          <Card className={`${
            Math.abs(totalPercentage - 100) > 1
              ? 'bg-[var(--color-warning-10)] border-[var(--color-warning)]'
              : 'bg-[var(--color-success-10)] border-[var(--color-success)]'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                Math.abs(totalPercentage - 100) > 1
                  ? 'text-[color:var(--color-warning)]'
                  : 'text-[color:var(--color-success)]'
              }`} />
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[color:var(--color-text-60)] mb-1">Total programado</p>
                    <p className="font-bold text-[color:var(--color-text)]">
                      {formatCurrency(totalScheduled)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--color-text-60)] mb-1">Porcentaje total</p>
                    <p className={`font-bold ${
                      Math.abs(totalPercentage - 100) > 1
                        ? 'text-[color:var(--color-warning)]'
                        : 'text-[color:var(--color-success)]'
                    }`}>
                      {totalPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {Math.abs(totalPercentage - 100) > 1 && (
                  <p className="text-xs text-[color:var(--color-warning)] mt-2">
                    ⚠️ El porcentaje total debe sumar 100%
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar plan de pagos
          </Button>
        </div>
      </div>
    </div>
  );
}
