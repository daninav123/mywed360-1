import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import { Card, Button } from '../ui';
import { formatCurrency } from '../../utils/formatUtils';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';

export default function ServiceLinesManager({
  providerId,
  serviceLines = [],
  onAddServiceLine,
  onUpdateServiceLine,
  onDeleteServiceLine,
  t,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryKey: '',
    assignedBudget: '',
    status: 'Pendiente',
    notes: '',
    deliverables: '',
  });

  const totalAssigned = serviceLines.reduce((sum, line) => sum + (Number(line.assignedBudget) || 0), 0);

  const handleOpenAdd = () => {
    setEditingLine(null);
    setFormData({
      name: '',
      categoryKey: '',
      assignedBudget: '',
      status: 'Pendiente',
      notes: '',
      deliverables: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (line) => {
    setEditingLine(line);
    setFormData({
      name: line.name || '',
      categoryKey: line.categoryKey || '',
      assignedBudget: String(line.assignedBudget || ''),
      status: line.status || 'Pendiente',
      notes: line.notes || '',
      deliverables: Array.isArray(line.deliverables) ? line.deliverables.join(', ') : '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    const assignedBudget = Number(formData.assignedBudget) || 0;
    const deliverables = formData.deliverables
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    const lineData = {
      name: formData.name.trim(),
      categoryKey: formData.categoryKey || normalizeBudgetCategoryKey(formData.name),
      assignedBudget,
      status: formData.status,
      notes: formData.notes.trim(),
      deliverables,
    };

    try {
      if (editingLine) {
        await onUpdateServiceLine(providerId, editingLine.id, lineData);
      } else {
        await onAddServiceLine(providerId, lineData);
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        categoryKey: '',
        assignedBudget: '',
        status: 'Pendiente',
        notes: '',
        deliverables: '',
      });
    } catch (error) {
      console.error('Error saving service line:', error);
    }
  };

  const handleDelete = async (lineId) => {
    if (window.confirm(t('suppliers.serviceLines.confirmDelete', { defaultValue: '¿Eliminar este servicio?' }))) {
      try {
        await onDeleteServiceLine(providerId, lineId);
      } catch (error) {
        console.error('Error deleting service line:', error);
      }
    }
  };

  const getCategoryName = (categoryKey) => {
    const category = SUPPLIER_CATEGORIES.find(cat => cat.id === categoryKey);
    return category?.name || categoryKey;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-body">
            {t('suppliers.serviceLines.title', { defaultValue: 'Líneas de Servicio' })}
          </h3>
          <p className="text-xs text-muted">
            {t('suppliers.serviceLines.subtitle', { defaultValue: 'Gestiona los servicios y presupuestos asignados' })}
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus size={14} />}>
          {t('suppliers.serviceLines.add', { defaultValue: 'Añadir Servicio' })}
        </Button>
      </div>

      {/* Service Lines List */}
      {serviceLines.length === 0 ? (
        <Card className="p-6 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-[color:var(--color-text-40)]" />
          <p className="text-sm text-muted mb-3">
            {t('suppliers.serviceLines.empty', { defaultValue: 'No hay servicios asignados' })}
          </p>
          <Button variant="outline" size="sm" onClick={handleOpenAdd}>
            {t('suppliers.serviceLines.addFirst', { defaultValue: 'Añadir primer servicio' })}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {serviceLines.map((line) => (
            <Card key={line.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={16} className="text-[color:var(--color-primary)]" />
                    <h4 className="text-sm font-semibold text-body">{line.name}</h4>
                    {line.categoryKey && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-10)] text-[color:var(--color-primary)]">
                        {getCategoryName(line.categoryKey)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className={`font-medium ${
                      line.status === 'Confirmado' ? 'text-[color:var(--color-success)]' :
                      line.status === 'Pendiente' ? 'text-[color:var(--color-warning)]' :
                      'text-muted'
                    }`}>
                      {line.status}
                    </span>
                    <span className="font-bold text-body">{formatCurrency(line.assignedBudget || 0)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(line)}
                    className="p-1.5 rounded-md text-[color:var(--color-primary)] hover:bg-[var(--color-primary-10)] transition-colors"
                    aria-label="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(line.id)}
                    className="p-1.5 rounded-md text-[color:var(--color-danger)] hover:bg-[var(--color-danger-10)] transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {line.notes && (
                <p className="text-xs text-muted mb-2">{line.notes}</p>
              )}

              {Array.isArray(line.deliverables) && line.deliverables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {line.deliverables.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[color:var(--color-border)] text-[color:var(--color-text-80)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}

          {/* Total */}
          <Card className="p-3 bg-[var(--color-primary-5)] border-[color:var(--color-primary-20)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[color:var(--color-primary)]">
                {t('suppliers.serviceLines.total', { defaultValue: 'Total Asignado' })}
              </span>
              <span className="text-lg font-bold text-[color:var(--color-primary)]">
                {formatCurrency(totalAssigned)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <Card className="w-full max-w-md m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-body mb-4">
              {editingLine
                ? t('suppliers.serviceLines.editTitle', { defaultValue: 'Editar Servicio' })
                : t('suppliers.serviceLines.addTitle', { defaultValue: 'Añadir Servicio' })}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.name', { defaultValue: 'Nombre del Servicio' })}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Catering, Fotografía, Música..."
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.category', { defaultValue: 'Categoría de Presupuesto' })}
                </label>
                <select
                  value={formData.categoryKey}
                  onChange={(e) => setFormData({ ...formData, categoryKey: e.target.value })}
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                >
                  <option value="">Seleccionar categoría...</option>
                  {SUPPLIER_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.budget', { defaultValue: 'Presupuesto Asignado (€)' })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.assignedBudget}
                  onChange={(e) => setFormData({ ...formData, assignedBudget: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.status', { defaultValue: 'Estado' })}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {/* Deliverables */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.deliverables', { defaultValue: 'Entregables (separados por comas)' })}
                </label>
                <input
                  type="text"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  placeholder="Ej: Menú, Bebidas, Personal de servicio"
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-text-80)] mb-1">
                  {t('suppliers.serviceLines.notes', { defaultValue: 'Notas' })}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                {t('app.cancel', { defaultValue: 'Cancelar' })}
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingLine
                  ? t('app.update', { defaultValue: 'Actualizar' })
                  : t('app.create', { defaultValue: 'Crear' })}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
