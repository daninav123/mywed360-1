import React, { useMemo } from 'react';
import { Card } from '../ui';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

/**
 * Análisis y gráficos financieros con i18n
 */
export default function FinanceCharts({ transactions, budgetUsage, stats }) {
  const { t } = useTranslations();

  // Colores para los gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  // Datos para gráfico de gastos por categoría
  const categoryData = useMemo(() => {
    return budgetUsage.map((category, index) => ({
      name: category.name,
      presupuestado: category.amount,
      gastado: category.spent,
      restante: Math.max(0, category.remaining),
      color: COLORS[index % COLORS.length]
    }));
  }, [budgetUsage]);

  // Datos para gráfico de tendencia mensual
  const monthlyTrend = useMemo(() => {
    const monthlyData = {};

    transactions.forEach(transaction => {
      if (!transaction.date) return;
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          ingresos: 0,
          gastos: 0,
          balance: 0
        };
      }

      const amount = Number(transaction.amount) || 0;
      if (transaction.type === 'income') {
        monthlyData[monthKey].ingresos += amount;
      } else {
        monthlyData[monthKey].gastos += amount;
      }

      monthlyData[monthKey].balance = monthlyData[monthKey].ingresos - monthlyData[monthKey].gastos;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Distribución de gastos por categoría
  const expenseDistribution = useMemo(() => {
    const distribution = {};

    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || t('finance.transactions.noCategory', { defaultValue: 'Sin categoría' });
        distribution[category] = (distribution[category] || 0) + (Number(transaction.amount) || 0);
      });

    return Object.entries(distribution)
      .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, t]);

  // Progreso del presupuesto por categoría
  const budgetProgress = useMemo(() => {
    return budgetUsage.map(category => ({
      name: category.name,
      porcentaje: Math.min(category.percentage, 100),
      exceso: Math.max(0, category.percentage - 100)
    }));
  }, [budgetUsage]);

  // Tooltip personalizado para moneda
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 border rounded-lg shadow-lg bg-[var(--color-surface)] border-[color:var(--color-text)]/15">
          <p className="font-medium text-[color:var(--color-text)]">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)]">{t('finance.charts.title', { defaultValue: 'Análisis Financiero' })}</h2>
        <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.subtitle', { defaultValue: 'Visualizaciones y tendencias de tus finanzas de boda' })}</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.totalTransactions', { defaultValue: 'Total Transacciones' })}</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{transactions.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.activeCategories', { defaultValue: 'Categorías Activas' })}</p>
          <p className="text-2xl font-bold text-blue-600">{budgetUsage.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.budgetEfficiency', { defaultValue: 'Eficiencia Presupuesto' })}</p>
          <p className="text-2xl font-bold text-[color:var(--color-success)]">{stats.totalBudget > 0 ? Math.round((1 - stats.totalSpent / stats.totalBudget) * 100) : 0}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.projectedBalance', { defaultValue: 'Balance Proyectado' })}</p>
          <p className={`text-2xl font-bold ${stats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>{formatCurrency(stats.currentBalance)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presupuesto vs Gastado */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.budgetVsSpentByCategory', { defaultValue: 'Presupuesto vs Gastado por Categoría' })}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="presupuestado" fill="#3B82F6" name={t('finance.charts.budgeted', { defaultValue: 'Presupuestado' })} />
                <Bar dataKey="gastado" fill="#EF4444" name={t('finance.charts.spent', { defaultValue: 'Gastado' })} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribución de gastos */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.expenseDistributionByCategory', { defaultValue: 'Distribución de Gastos por Categoría' })}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {expenseDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tendencia mensual */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.monthlyTrend', { defaultValue: 'Tendencia Mensual de Ingresos y Gastos' })}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `€${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name={t('finance.charts.income', { defaultValue: 'Ingresos' })} />
                <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name={t('finance.charts.expenses', { defaultValue: 'Gastos' })} />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" name={t('finance.charts.balance', { defaultValue: 'Balance' })} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Progreso del presupuesto */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.budgetProgressByCategory', { defaultValue: 'Progreso del Presupuesto por Categoría' })}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetProgress} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 150]} tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Tooltip formatter={(value, name) => [`${value.toFixed(1)}%`, name === 'porcentaje' ? t('finance.charts.used', { defaultValue: 'Usado' }) : t('finance.charts.excess', { defaultValue: 'Exceso' })]} />
                <Legend />
                <Bar dataKey="porcentaje" fill="#10B981" name={t('finance.charts.used', { defaultValue: 'Usado' })} />
                <Bar dataKey="exceso" fill="#EF4444" name={t('finance.charts.excess', { defaultValue: 'Exceso' })} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Resumen de insights */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.insights', { defaultValue: 'Insights Financieros' })}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Categoría con mayor gasto */}
          {expenseDistribution.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-danger)]/10">
              <h4 className="font-medium text-[color:var(--color-danger)] mb-2">{t('finance.charts.highestExpense', { defaultValue: 'Mayor Gasto' })}</h4>
              <p className="text-sm text-[color:var(--color-danger)]/90">
                <span className="font-medium">{expenseDistribution[0].name}</span>
                <br />
                {formatCurrency(expenseDistribution[0].value)}
              </p>
            </div>
          )}

          {/* Categoría más eficiente */}
          {budgetUsage.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-success)]/10">
              <h4 className="font-medium text-[color:var(--color-success)] mb-2">{t('finance.charts.mostEfficient', { defaultValue: 'Más Eficiente' })}</h4>
              <p className="text-sm text-[color:var(--color-success)]/90">
                {(() => {
                  const mostEfficient = budgetUsage
                    .filter(cat => cat.amount > 0)
                    .sort((a, b) => a.percentage - b.percentage)[0];
                  return mostEfficient ? (
                    <>
                      <span className="font-medium">{mostEfficient.name}</span>
                      <br />
                      {mostEfficient.percentage.toFixed(1)}% {t('finance.overview.used', { defaultValue: 'utilizado' })}
                    </>
                  ) : t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' });
                })()}
              </p>
            </div>
          )}

          {/* Tendencia del mes */}
          {monthlyTrend.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-primary)]/10">
              <h4 className="font-medium text-[var(--color-primary)] mb-2">{t('finance.charts.currentTrend', { defaultValue: 'Tendencia Actual' })}</h4>
              <p className="text-sm text-[var(--color-primary)]/90">
                {(() => {
                  const lastMonth = monthlyTrend[monthlyTrend.length - 1];
                  const trend = lastMonth.balance >= 0 ? t('finance.charts.trend.positive', { defaultValue: 'Positiva' }) : t('finance.charts.trend.negative', { defaultValue: 'Negativa' });
                  return (
                    <>
                      <span className="font-medium">{trend}</span>
                      <br />
                      {t('finance.charts.balanceLabel', { defaultValue: 'Balance:' })} {formatCurrency(lastMonth.balance)}
                    </>
                  );
                })()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
