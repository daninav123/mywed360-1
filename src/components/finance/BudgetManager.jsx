import { Plus, Edit3, Trash2, AlertTriangle, Target } from 'lucide-react';
import React, { useState } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';
import Modal from '../Modal';
import { Card, Button } from '../ui';

export default function BudgetManager({
  budget,
  budgetUsage,
  onUpdateBudget,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  alertThresholds = { warn: 75, danger: 90 },
  onUpdateSettings,
}) {
  const { t } = useTranslations();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);
  const [newCategory, setNewCategory] = useState({ name: '', amount: '' });

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
      alert('El nombre de la categor�a es obligatorio');
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
    if (window.confirm(`Estas seguro de eliminar la categor�a "${categoryName}"?`)) {
      onRemoveCategory(index);
    }
  };

  const totalBudgeted = budget.categories.reduce((sum, cat) => sum + (Number(cat.amount) || 0), 0);
  const totalSpent = budgetUsage.reduce((sum, cat) => sum + (Number(cat.spent) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
            {t('finance.budget.title', { defaultValue: 'Gestión de presupuesto' })}
          </h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            {t('finance.budget.subtitle', {
              defaultValue: 'Organiza y controla el presupuesto por categor�as',
            })}
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
          {t('finance.budget.newCategory', { defaultValue: 'Nueva categor�a' })}
        </Button>
      </div>

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
              {formatCurrency(budget.total)}
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

        {onUpdateSettings && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">
                Umbrales de alertas (globales)
              </p>
            </div>
            <div>
              <label className="block text-sm text-[color:var(--color-text)]/70 mb-1">
                Aviso (en riesgo) %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={alertThresholds.warn}
                onChange={(e) => onUpdateSettings?.({ warn: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md border-[color:var(--color-text)]/20"
              />
            </div>
            <div>
              <label className="block text-sm text-[color:var(--color-text)]/70 mb-1">
                {t('finance.budget.thresholds.danger', { defaultValue: 'Cr�tico (exceso) %' })}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={alertThresholds.danger}
                onChange={(e) => onUpdateSettings?.({ danger: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md border-[color:var(--color-text)]/20"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between text-sm text-[color:var(--color-text)]/70 mb-2">
            <span>
              {t('finance.budget.overallProgress', { defaultValue: 'Progreso del presupuesto' })}
            </span>
            <span>{budget.total > 0 ? ((totalSpent / budget.total) * 100).toFixed(1) : 0}%</span>
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
        <div className="px-6 py-4 border-b border-[color:var(--color-text)]/10">
          <h3 className="text-lg font-medium text-[color:var(--color-text)]">
            {t('finance.budget.categoriesTitle', { defaultValue: 'categor�as de presupuesto' })}
          </h3>
        </div>
        {budgetUsage.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[color:var(--color-text)]/70 mb-4">
              {t('finance.budget.empty', { defaultValue: 'No hay categor�as de presupuesto' })}
            </p>
            <Button leftIcon={<Plus size={16} />} onClick={handleAddCategory}>
              {t('finance.budget.createFirst', { defaultValue: 'Crear primera categor�a' })}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--color-text)]/10">
            {budgetUsage.map((category, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-[color:var(--color-text)]">
                      {category.name}
                    </h4>
                    {category.percentage >= 100 && (
                      <div className="flex items-center text-[color:var(--color-danger)] bg-[var(--color-danger)]/10 px-2 py-1 rounded-full">
                        <AlertTriangle size={14} className="mr-1" />
                        <span className="text-xs font-medium">Excedido</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center gap-1 text-xs text-[color:var(--color-text)]/70">
                      <input
                        type="checkbox"
                        checked={Boolean(category.muted)}
                        onChange={(e) => onUpdateCategory(index, { muted: e.target.checked })}
                      />
                      Silenciar alertas
                    </label>
                    <button
                      aria-label="Editar categor�a"
                      onClick={() => handleEditCategory(category, index)}
                      className="text-[var(--color-primary)] hover:brightness-110 p-1"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      aria-label="Eliminar categor�a"
                      onClick={() => handleDeleteCategory(index, category.name)}
                      className="text-[color:var(--color-danger)] hover:brightness-110 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">
                      {t('finance.budget.budgeted', { defaultValue: 'Presupuestado' })}
                    </p>
                    <p className="text-lg font-semibold text-[color:var(--color-text)]">
                      {formatCurrency(category.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">
                      {t('finance.budget.spent', { defaultValue: 'Gastado' })}
                    </p>
                    <p className="text-lg font-semibold text-[color:var(--color-danger)]">
                      {formatCurrency(category.spent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">
                      {t('finance.budget.remaining', { defaultValue: 'Restante' })}
                    </p>
                    <p
                      className={`text-lg font-semibold ${category.remaining >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}
                    >
                      {formatCurrency(category.remaining)}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[color:var(--color-text)]/70 mb-2">
                    <span>{t('finance.budget.progress', { defaultValue: 'Progreso' })}</span>
                    <span>{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[color:var(--color-text)]/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${category.percentage >= 100 ? 'bg-[var(--color-danger)]' : category.percentage >= (alertThresholds.warn || 75) ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
            ? t('finance.budget.modal.editTitle', { defaultValue: 'Editar categor�a' })
            : t('finance.budget.modal.newTitle', { defaultValue: 'Nueva categor�a' })
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1">
              {t('finance.budget.modal.name', { defaultValue: 'Nombre de la categor�a' })}
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
              Presupuesto asignado (�)
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
              {t('finance.budget.category', { defaultValue: 'categor�a' })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
