/**
 * ExpenseList Component
 * Lista y gestión de gastos
 * Sprint 4 - Completar Finance, S4-T004
 */

import React, { useState } from 'react';
import useTranslations from '../../hooks/useTranslations';
import {
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { EXPENSE_CATEGORIES, PAYMENT_STATUS } from '../../services/financeService';

/**
 * ExpenseList
 * @param {Object} props
 * @param {Array} props.expenses - Lista de gastos
 * @param {Function} props.onEdit - Callback al editar
 * @param {Function} props.onDelete - Callback al eliminar
 * @param {Function} props.onPayment - Callback al registrar pago
 */
export function ExpenseList({ expenses = [], onEdit, onDelete, onPayment }) {
  const { currentLanguage } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, amount, name

  // Filtrar y ordenar gastos
  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch =
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const getStatusIcon = (status) => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case PAYMENT_STATUS.PARTIAL:
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case PAYMENT_STATUS.OVERDUE:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'Pagado';
      case PAYMENT_STATUS.PARTIAL:
        return 'Parcial';
      case PAYMENT_STATUS.OVERDUE:
        return 'Vencido';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case PAYMENT_STATUS.PARTIAL:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case PAYMENT_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o proveedor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value={PAYMENT_STATUS.PENDING}>Pendientes</option>
              <option value={PAYMENT_STATUS.PARTIAL}>Parciales</option>
              <option value={PAYMENT_STATUS.PAID}>Pagados</option>
              <option value={PAYMENT_STATUS.OVERDUE}>Vencidos</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="date">Fecha</option>
              <option value="amount">Monto</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
        {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' ? ' encontrados' : ''}
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron gastos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer gasto'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const category =
              EXPENSE_CATEGORIES[expense.category?.toUpperCase()] || EXPENSE_CATEGORIES.OTHER;
            const percentPaid =
              expense.amount > 0 ? ((expense.totalPaid || 0) / expense.amount) * 100 : 0;

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {expense.name}
                        </h3>
                        {expense.vendor && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {expense.vendor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(expense.status)}`}
                      >
                        {getStatusIcon(expense.status)}
                        {getStatusText(expense.status)}
                      </span>
                      {expense.dueDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Vence:{' '}
                          {(() => {
                            try {
                              return new Intl.DateTimeFormat(currentLanguage || 'es', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }).format(new Date(expense.dueDate));
                            } catch {
                              return new Date(expense.dueDate).toString();
                            }
                          })()}
                        </span>
                      )}
                    </div>

                    {/* Payment Progress */}
                    {expense.status !== PAYMENT_STATUS.PAID &&
                      expense.status !== PAYMENT_STATUS.PENDING && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Pagado: ${(expense.totalPaid || 0).toLocaleString()}</span>
                            <span>{percentPaid.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(percentPaid, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${expense.amount.toLocaleString()}
                      </div>
                      {expense.status !== PAYMENT_STATUS.PAID && expense.remaining > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Pendiente: ${expense.remaining.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {expense.status !== PAYMENT_STATUS.PAID && (
                        <button
                          onClick={() => onPayment?.(expense)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Registrar pago"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit?.(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este gasto?')) {
                            onDelete?.(expense.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {expense.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{expense.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExpenseList;
