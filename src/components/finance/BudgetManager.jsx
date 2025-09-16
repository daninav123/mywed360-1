import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Plus, Edit3, Trash2, AlertTriangle, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';
import Modal from '../Modal';

/**
 * Componente para Gestion de presupuesto y categorias
 * Permite crear, editar y eliminar categorias de presupuesto
 */
export default function BudgetManager({ 
  budget, 
  budgetUsage, 
  onUpdateBudget, 
  onAddCategory, 
  onUpdateCategory, 
  onRemoveCategory 
}) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);
  const [newCategory, setnewCategory] = useState({ name: '', amount: '' });

  // Manejar apertura de modal para nueva categoria
  const handleAddCategory = () => {
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setnewCategory({ name: '', amount: '' });
    setShowCategoryModal(true);
  };

  // Manejar apertura de modal para editar categoria
  const handleEditCategory = (category, index) => {
    setEditingCategory(category);
    setEditingCategoryIndex(index);
    setnewCategory({ name: category.name, amount: category.amount.toString() });
    setShowCategoryModal(true);
  };

  // Manejar guardado de categoria
  const handleSaveCategory = () => {
    const amount = Number(newCategory.amount);
    
    if (!newCategory.name.trim()) {
      alert('El nombre de la categoria es obligatorio');
      return;
    }
    
    if (isNaN(amount) || amount < 0) {
      alert('El monto debe ser un nÃƒÆ’Ã‚Âºmero vÃƒÆ’Ã‚Â¡lido');
      return;
    }

    if (editingCategory) {
      // Editar categoria existente
      onUpdateCategory(editingCategoryIndex, { 
        name: newCategory.name.trim(), 
        amount 
      });
    } else {
      // Agregar nueva categoria
      const result = onAddCategory(newCategory.name.trim(), amount);
      if (!result.success) {
        alert(result.error);
        return;
      }
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setEditingCategoryIndex(-1);
    setnewCategory({ name: '', amount: '' });
  };

  // Manejar eliminaciÃƒÆ’Ã‚Â³n de categoria
  const handleDeleteCategory = (index, categoryName) => {
    if (window.confirm(`Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡s seguro de eliminar la categoria "${categoryName}"?`)) {
      onRemoveCategory(index);
    }
  };

  // Calcular totales
  const totalBudgeted = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalSpent = budgetUsage.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Gestion de Presupuesto</h2>
          <p className="text-sm text-[color:var(--color-text)]/70">
            Organiza y controla el presupuesto por categorias
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={handleAddCategory}
        >
          Nueva categoria
        </Button>
      </div>

      {/* Resumen general del presupuesto */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">Presupuesto Total</p>
            <p className="text-2xl font-bold text-[color:var(--color-text)]">{formatCurrency(budget.total)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-success)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[color:var(--color-success)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">Presupuestado</p>
            <p className="text-2xl font-bold text-[color:var(--color-success)]">{formatCurrency(totalBudgeted)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-danger)]/15 rounded-full mx-auto mb-3">
              <Target className="w-6 h-6 text-[color:var(--color-danger)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--color-text)]/70">Gastado</p>
            <p className="text-2xl font-bold text-[color:var(--color-danger)]">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* Barra de progreso general */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-[color:var(--color-text)]/70 mb-2">
            <span>Progreso del presupuesto</span>
            <span>{budget.total > 0 ? ((totalSpent / budget.total) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="w-full bg-[color:var(--color-text)]/10 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalSpent > budget.total 
                  ? 'bg-[var(--color-danger)]' 
                  : totalSpent > budget.total * 0.8 
                  ? 'bg-[var(--color-warning)]' 
                  : 'bg-[var(--color-success)]'
              }`}
              style={{ 
                width: `${Math.min((totalSpent / budget.total) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </Card>

      {/* Lista de categorias */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-[color:var(--color-text)]/10">
          <h3 className="text-lg font-medium text-[color:var(--color-text)]">categorias de Presupuesto</h3>
        </div>
        
        {budgetUsage.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No hay categorias de presupuesto</p>
            <Button onClick={handleAddCategory} leftIcon={<Plus size={16} />}>
              Crear primera categoria
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--color-text)]/10">
            {budgetUsage.map((category, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-[color:var(--color-text)]">
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
                    <button
                      onClick={() => handleEditCategory(category, index)}
                      className="text-[var(--color-primary)] hover:brightness-110 p-1"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(index, category.name)}
                      className="text-[color:var(--color-danger)] hover:brightness-110 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">Presupuestado</p>
                    <p className="text-lg font-semibold text-[color:var(--color-text)]">
                      {formatCurrency(category.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">Gastado</p>
                    <p className="text-lg font-semibold text-[color:var(--color-danger)]">
                      {formatCurrency(category.spent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--color-text)]/70">Restante</p>
                    <p className={`text-lg font-semibold ${
                      category.remaining >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
                    }`}>
                      {formatCurrency(category.remaining)}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso de la categoria */}
                <div>
                  <div className="flex justify-between text-sm text-[color:var(--color-text)]/70 mb-2">
                    <span>Progreso</span>
                    <span>{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[color:var(--color-text)]/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.percentage >= 100 
                          ? 'bg-[var(--color-danger)]' 
                          : category.percentage >= 75 
                          ? 'bg-[var(--color-warning)]' 
                          : 'bg-[var(--color-success)]'
                      }`}
                      style={{ 
                        width: `${Math.min(category.percentage, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal para agregar/editar categoria */}
      <Modal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setEditingCategoryIndex(-1);
          setnewCategory({ name: '', amount: '' });
        }}
        title={editingCategory ? 'Editar categoria' : 'Nueva categoria'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la categoria
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setnewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Ej: Catering, MÃƒÆ’Ã‚Âºsica, Flores..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presupuesto asignado (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newCategory.amount}
              onChange={(e) => setnewCategory({ ...newCategory, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setEditingCategoryIndex(-1);
                setnewCategory({ name: '', amount: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Actualizar' : 'Crear'} categoria
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

