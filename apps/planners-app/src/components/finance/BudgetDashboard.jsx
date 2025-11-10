/**
 * BudgetDashboard Component
 * Dashboard principal de presupuesto y finanzas
 * Sprint 4 - Completar Finance
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../services/financeService';

/**
 * BudgetDashboard
 * @param {Object} props
 * @param {Object} props.stats - Estad�sticas del presupuesto
 * @param {Object} props.budget - Datos del presupuesto
 * @param {Array} props.expenses - Lista de gastos
 */
export function BudgetDashboard({ stats, budget, expenses = [] }) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cargando estad�sticas...</p>
      </div>
    );
  }

  const isOverBudget = stats.remaining < 0;
  const warningThreshold = stats.totalBudget * 0.9;
  const isNearLimit = stats.totalSpent >= warningThreshold;

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuesto Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Presupuesto Total
            </span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.totalBudget.toLocaleString()}
          </div>
        </div>

        {/* Gastado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Gastado
            </span>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.totalSpent.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {stats.percentageUsed.toFixed(1)}% del presupuesto
          </div>
        </div>

        {/* Pagado */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pagado
            </span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.totalPaid.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            ${stats.totalPending.toLocaleString()} pendiente
          </div>
        </div>

        {/* Restante */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ${
          isOverBudget ? 'ring-2 ring-red-500' : ''
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Restante
            </span>
            {isOverBudget ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            isOverBudget 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            ${Math.abs(stats.remaining).toLocaleString()}
          </div>
          {isOverBudget && (
            <div className="mt-1 text-sm text-red-500">
              �Sobre presupuesto!
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {(isOverBudget || isNearLimit) && (
        <div className={`rounded-lg p-4 ${
          isOverBudget 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              isOverBudget ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <h4 className={`font-semibold ${
                isOverBudget ? 'text-red-900 dark:text-red-200' : 'text-yellow-900 dark:text-yellow-200'
              }`}>
                {isOverBudget ? 'Presupuesto Excedido' : 'Cerca del L�mite'}
              </h4>
              <p className={`text-sm mt-1 ${
                isOverBudget ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {isOverBudget 
                  ? `Has excedido el presupuesto en $${Math.abs(stats.remaining).toLocaleString()}. Considera revisar tus gastos.`
                  : `Has usado el ${stats.percentageUsed.toFixed(1)}% de tu presupuesto. Te acercas al l�mite.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Progreso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Uso del Presupuesto
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {stats.percentageUsed.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget 
                ? 'bg-red-500' 
                : stats.percentageUsed > 90 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Gastos por Categor�a */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gastos por Categor�a
        </h3>
        <div className="space-y-3">
          {Object.values(stats.byCategory)
            .filter(cat => cat.total > 0)
            .sort((a, b) => b.total - a.total)
            .map(category => (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${category.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {category.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Estado de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estado de Pagos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.byStatus.paid}
            </div>
            <div className="text-sm text-gray-500">Pagados</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.byStatus.partial}
            </div>
            <div className="text-sm text-gray-500">Parciales</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.byStatus.pending}
            </div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.byStatus.overdue}
            </div>
            <div className="text-sm text-gray-500">Vencidos</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetDashboard;
