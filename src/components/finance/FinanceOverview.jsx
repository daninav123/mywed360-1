import React from 'react';
import { Card } from '../ui';
import { Cloud, CloudOff, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Componente de resumen general de finanzas
 * Muestra estadísticas clave, balance y estado de sincronización
 */
export default function FinanceOverview({ stats, syncStatus, budgetUsage }) {
  const getBudgetStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-[color:var(--color-danger)] bg-[var(--color-danger)]/10';
    if (percentage >= 75) return 'text-[color:var(--color-warning)] bg-[var(--color-warning)]/10';
    return 'text-[color:var(--color-success)] bg-[var(--color-success)]/10';
  };

  const getBudgetIcon = (percentage) => {
    if (percentage >= 90) return <AlertTriangle size={16} />;
    if (percentage >= 75) return <TrendingUp size={16} />;
    return <CheckCircle size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Header con estado de sincronización */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--color-text)]">
            Gestión Financiera
          </h1>
          <p className="text-[color:var(--color-text)]/70 mt-1">
            Control completo de presupuesto y gastos de tu boda
          </p>
        </div>
        
        {/* Indicador de sincronización */}
        <div className="flex items-center space-x-2">
          {syncStatus.isOnline ? (
            <div className="flex items-center text-[color:var(--color-success)] bg-[var(--color-success)]/10 px-3 py-1 rounded-full">
              <Cloud size={16} className="mr-2" />
              <span className="text-sm font-medium">Sincronizado</span>
            </div>
          ) : (
            <div className="flex items-center text-[color:var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1 rounded-full">
              <CloudOff size={16} className="mr-2" />
              <span className="text-sm font-medium">Sin conexión</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuesto total */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">Presupuesto Total</p>
              <p className="text-2xl font-bold text-[color:var(--color-text)]">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-primary)]/15 rounded-full">
              <TrendingUp className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        {/* Gastado */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">Total Gastado</p>
              <p className="text-2xl font-bold text-[color:var(--color-danger)]">
                {formatCurrency(stats.totalSpent)}
              </p>
              <p className="text-xs text-[color:var(--color-text)]/60 mt-1">
                {stats.budgetUsagePercentage.toFixed(1)}% del presupuesto
              </p>
            </div>
            <div className="p-3 bg-[var(--color-danger)]/10 rounded-full">
              <TrendingDown className="w-6 h-6 text-[color:var(--color-danger)]" />
            </div>
          </div>
        </Card>

        {/* Balance actual */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">Balance Actual</p>
              <p className={`text-2xl font-bold ${stats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
                {formatCurrency(stats.currentBalance)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.currentBalance >= 0 ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-danger)]/10'}`}>
              {stats.currentBalance >= 0 ? (
                <CheckCircle className="w-6 h-6 text-[color:var(--color-success)]" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[color:var(--color-danger)]" />
              )}
            </div>
          </div>
        </Card>

        {/* Ingresos esperados */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[color:var(--color-text)]/70">Ingresos Esperados</p>
              <p className="text-2xl font-bold text-[color:var(--color-success)]">
                {formatCurrency(stats.expectedIncome)}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-success)]/10 rounded-full">
              <TrendingUp className="w-6 h-6 text-[color:var(--color-success)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas de presupuesto */}
      {budgetUsage.some(cat => cat.percentage >= 75) && (
        <Card className="p-4 border-[color:var(--color-warning)]/30 bg-[var(--color-warning)]/10">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[color:var(--color-warning)] mt-0.5" />
            <div>
              <h3 className="font-medium text-[color:var(--color-warning)]">Alertas de Presupuesto</h3>
              <div className="mt-2 space-y-1">
                {budgetUsage
                  .filter(cat => cat.percentage >= 75)
                  .map((cat, index) => (
                    <p key={index} className="text-sm text-[color:var(--color-warning)]/90">
                      <span className="font-medium">{cat.name}</span>: {cat.percentage.toFixed(1)}% utilizado
                      {cat.percentage >= 100 && ' (¡Presupuesto excedido!)'}
                    </p>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Resumen de categorías */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-4">
          Estado del Presupuesto por Categorías
        </h3>
        <div className="space-y-3">
          {budgetUsage.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[color:var(--color-text)]/80">
                    {category.name}
                  </span>
                  <span className="text-sm text-[color:var(--color-text)]/60">
                    {formatCurrency(category.spent)} / {formatCurrency(category.amount)}
                  </span>
                </div>
                <div className="w-full rounded-full h-2 bg-[color:var(--color-text)]/10">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      category.percentage >= 100 
                        ? 'bg-[var(--color-danger)]' 
                        : category.percentage >= 75 
                        ? 'bg-[var(--color-warning)]' 
                        : 'bg-[var(--color-success)]'
                    }`}
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getBudgetStatusColor(category.percentage)}`}>
                <div className="flex items-center space-x-1">
                  {getBudgetIcon(category.percentage)}
                  <span>{category.percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
