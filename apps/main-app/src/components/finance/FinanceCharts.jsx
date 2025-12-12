import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, PieChart as PieChartIcon, Target, Lightbulb, AlertCircle } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';
import { formatCurrency } from '../../utils/formatUtils';
import { Card } from '../ui';

// Token-based palette for categorical series (fallback cycles)
const COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  'var(--color-accent)',
];

const toFinite = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const hasFiniteForKeys = (arr, keys) =>
  Array.isArray(arr) && arr.some((item) => keys.some((k) => Number.isFinite(Number(item?.[k]))));

const sanitizeTransactions = (transactions) =>
  Array.isArray(transactions) ? transactions.filter(Boolean) : [];
const sanitizeBudget = (budgetUsage) =>
  Array.isArray(budgetUsage) ? budgetUsage.filter(Boolean) : [];

const buildCategoryData = (budgetUsage) =>
  sanitizeBudget(budgetUsage).map((category, index) => ({
    name: String(category?.name || ''),
    presupuestado: toFinite(category?.amount),
    gastado: toFinite(category?.spent),
    restante: Math.max(0, toFinite(category?.remaining)),
    color: COLORS[index % COLORS.length],
  }));

const buildMonthlyTrend = (transactions) => {
  const monthlyData = {};
  sanitizeTransactions(transactions).forEach((tx) => {
    if (!tx?.date) return;
    const date = new Date(tx.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) monthlyData[key] = { month: key, ingresos: 0, gastos: 0, balance: 0 };
    const amount = toFinite(tx.amount);
    if (tx.type === 'income') monthlyData[key].ingresos += amount;
    else monthlyData[key].gastos += amount;
    monthlyData[key].balance = monthlyData[key].ingresos - monthlyData[key].gastos;
  });
  return Object.values(monthlyData)
    .map((item) => ({
      month: item.month,
      ingresos: toFinite(item.ingresos),
      gastos: toFinite(item.gastos),
      balance: toFinite(item.balance),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const buildExpenseDistribution = (transactions, t) => {
  const distribution = {};
  sanitizeTransactions(transactions)
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const category =
        tx.category || t('finance.transactions.noCategory', { defaultValue: 'Sin categoría' });
      distribution[category] = toFinite(distribution[category]) + toFinite(tx.amount);
    });
  return Object.entries(distribution)
    .map(([name, value], index) => ({
      name,
      value: toFinite(value),
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
};

const buildBudgetProgress = (budgetUsage) =>
  sanitizeBudget(budgetUsage).map((category) => ({
    name: String(category?.name || ''),
    porcentaje: Math.min(toFinite(category?.percentage), 100),
    exceso: Math.max(0, toFinite(category?.percentage) - 100),
  }));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 border rounded-lg shadow-lg bg-[var(--color-surface)] border-[color:var(--color-text)]/15">
        <p className="font-medium text-[color:var(--color-text)]">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(toFinite(entry.value))}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinanceCharts({ transactions = [], budgetUsage = [], stats = {} }) {
  const { t } = useTranslations();

  const safeTransactions = sanitizeTransactions(transactions);
  const safeBudget = sanitizeBudget(budgetUsage);
  const safeStats = {
    totalBudget: toFinite(stats?.totalBudget),
    totalSpent: toFinite(stats?.totalSpent),
    currentBalance: toFinite(stats?.currentBalance),
    expectedIncome: toFinite(stats?.expectedIncome),
    totalIncome: toFinite(stats?.totalIncome),
  };

  const categoryData = useMemo(() => buildCategoryData(safeBudget), [safeBudget]);
  const monthlyTrend = useMemo(() => buildMonthlyTrend(safeTransactions), [safeTransactions]);
  const expenseDistribution = useMemo(
    () => buildExpenseDistribution(safeTransactions, t),
    [safeTransactions, t]
  );
  const budgetProgress = useMemo(() => buildBudgetProgress(safeBudget), [safeBudget]);

  const totalTransactions = safeTransactions.length;
  const activeCategories = safeBudget.length;
  const efficiency =
    safeStats.totalBudget > 0
      ? Math.round((1 - safeStats.totalSpent / safeStats.totalBudget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-primary)] mb-1">
                {t('finance.charts.totalTransactions', { defaultValue: 'Transacciones' })}
              </p>
              <p className="text-2xl font-black text-body">{totalTransactions}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[color:var(--color-primary)]/40" />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)] mb-1">
                {t('finance.charts.activeCategories', { defaultValue: 'Categorías' })}
              </p>
              <p className="text-2xl font-black text-[color:var(--color-success)]">{activeCategories}</p>
            </div>
            <PieChartIcon className="w-8 h-8 text-[color:var(--color-success)]/40" />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)] mb-1">
                {t('finance.charts.budgetEfficiency', { defaultValue: 'Eficiencia' })}
              </p>
              <p className="text-2xl font-black text-[color:var(--color-warning)]">{efficiency}%</p>
            </div>
            <Target className="w-8 h-8 text-[color:var(--color-warning)]/40" />
          </div>
        </Card>

        <Card className={`p-4 ${safeStats.currentBalance >= 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'}/10 border ${safeStats.currentBalance >= 0 ? 'border-[var(--color-success)]' : 'border-[var(--color-danger)]'}/30`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'} mb-1`}>
                {t('finance.charts.projectedBalance', { defaultValue: 'Balance' })}
              </p>
              <p className={`text-2xl font-black ${safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
                {formatCurrency(safeStats.currentBalance)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}/40`} />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
                {t('finance.charts.budgetVsSpentByCategory', {
                  defaultValue: 'Presupuesto vs Gastado',
                })}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.charts.budgetVsSpentDesc', {
                  defaultValue: 'Compara lo asignado vs lo gastado por categoría',
                })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
              <PieChartIcon className="w-5 h-5 text-[color:var(--color-primary)]" />
            </div>
          </div>
          <div className="h-80">
            {hasFiniteForKeys(categoryData, ['presupuestado', 'gastado']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis
                    domain={[0, 'auto']}
                    tickFormatter={(value) => formatCurrency(toFinite(value))}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="presupuestado"
                    fill="var(--color-primary)"
                    name={t('finance.charts.budgeted', { defaultValue: 'Presupuestado' })}
                  />
                  <Bar
                    dataKey="gastado"
                    fill="var(--color-danger)"
                    name={t('finance.charts.spent', { defaultValue: 'Gastado' })}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text)]/70">
                {t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
                {t('finance.charts.expenseDistributionByCategory', {
                  defaultValue: 'Distribución de Gastos',
                })}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.charts.expenseDistributionDesc', {
                  defaultValue: 'Proporción de cada categoría en el total de gastos',
                })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--color-danger)]/10">
              <PieChartIcon className="w-5 h-5 text-[color:var(--color-danger)]" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${Number.isFinite(percent) ? (percent * 100).toFixed(0) : '0'}%`
                  }
                  outerRadius={80}
                  fill="var(--color-primary)"
                  dataKey="value"
                >
                  {expenseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(toFinite(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
                {t('finance.charts.monthlyTrend', {
                  defaultValue: 'Tendencia Mensual',
                })}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.charts.monthlyTrendDesc', {
                  defaultValue: 'Evolución de ingresos, gastos y balance mes a mes',
                })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--color-success)]/10">
              <TrendingUp className="w-5 h-5 text-[color:var(--color-success)]" />
            </div>
          </div>
          <div className="h-80">
            {hasFiniteForKeys(monthlyTrend, ['ingresos', 'gastos', 'balance']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    domain={[0, 'auto']}
                    tickFormatter={(value) => formatCurrency(toFinite(value))}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    name={t('finance.charts.income', { defaultValue: 'Ingresos' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="var(--color-danger)"
                    strokeWidth={2}
                    name={t('finance.charts.expenses', { defaultValue: 'Gastos' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={t('finance.charts.balance', { defaultValue: 'Balance' })}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text)]/70">
                {t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
                {t('finance.charts.budgetProgressByCategory', {
                  defaultValue: 'Progreso del Presupuesto',
                })}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {t('finance.charts.budgetProgressDesc', {
                  defaultValue: 'Porcentaje de uso y exceso por categoría',
                })}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-[var(--color-warning)]/10">
              <Target className="w-5 h-5 text-[color:var(--color-warning)]" />
            </div>
          </div>
          <div className="h-80">
            {hasFiniteForKeys(budgetProgress, ['porcentaje', 'exceso']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetProgress} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 150]}
                    tickFormatter={(value) => `${toFinite(value)}%`}
                  />
                  <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(toFinite(value)).toFixed(1)}%`,
                      name === 'porcentaje'
                        ? t('finance.charts.used', { defaultValue: 'Usado' })
                        : t('finance.charts.excess', { defaultValue: 'Exceso' }),
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="porcentaje"
                    fill="var(--color-success)"
                    name={t('finance.charts.used', { defaultValue: 'Usado' })}
                  />
                  <Bar
                    dataKey="exceso"
                    fill="var(--color-danger)"
                    name={t('finance.charts.excess', { defaultValue: 'Exceso' })}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text)]/70">
                {t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Insights Premium */}
      <Card className="p-6 bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--color-primary)]/15">
            <Lightbulb className="w-6 h-6 text-[color:var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[color:var(--color-text)]">
              {t('finance.charts.insights', { defaultValue: 'Insights Financieros' })}
            </h3>
            <p className="text-sm text-[color:var(--color-text)]/60">
              {t('finance.charts.insightsDesc', { defaultValue: 'Análisis automático de tus finanzas' })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseDistribution.length > 0 && (
            <div className="p-5 rounded-xl bg-[var(--color-danger)]/10 border-2 border-[var(--color-danger)]/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-[color:var(--color-danger)]" />
                <h4 className="font-bold text-[color:var(--color-danger)]">
                  {t('finance.charts.highestExpense', { defaultValue: 'Mayor Gasto' })}
                </h4>
              </div>
              <p className="text-sm text-[color:var(--color-text)]/80">
                <span className="font-semibold text-lg block mb-1">{expenseDistribution[0].name}</span>
                <span className="text-xl font-black text-[color:var(--color-danger)]">
                  {formatCurrency(expenseDistribution[0].value)}
                </span>
              </p>
            </div>
          )}

          {safeBudget.length > 0 && (
            <div className="p-5 rounded-xl bg-[var(--color-success)]/10 border-2 border-[var(--color-success)]/20">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[color:var(--color-success)]" />
                <h4 className="font-bold text-[color:var(--color-success)]">
                  {t('finance.charts.mostEfficient', { defaultValue: 'Más Eficiente' })}
                </h4>
              </div>
              <p className="text-sm text-[color:var(--color-text)]/80">
                {(() => {
                  const mostEfficient = safeBudget
                    .filter((cat) => toFinite(cat.amount) > 0)
                    .sort((a, b) => toFinite(a.percentage) - toFinite(b.percentage))[0];
                  return mostEfficient ? (
                    <>
                      <span className="font-semibold text-lg block mb-1">{mostEfficient.name}</span>
                      <span className="text-xl font-black text-[color:var(--color-success)]">
                        {toFinite(mostEfficient.percentage).toFixed(1)}%{' '}
                        {t('finance.overview.used', { defaultValue: 'usado' })}
                      </span>
                    </>
                  ) : (
                    t('finance.charts.noData', { defaultValue: 'No hay datos' })
                  );
                })()}
              </p>
            </div>
          )}

          {monthlyTrend.length > 0 && (
            <div className="p-5 rounded-xl bg-[var(--color-primary)]/10 border-2 border-[var(--color-primary)]/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[color:var(--color-primary)]" />
                <h4 className="font-bold text-[color:var(--color-primary)]">
                  {t('finance.charts.bestMonth', { defaultValue: 'Mejor Mes' })}
                </h4>
              </div>
              <p className="text-sm text-[color:var(--color-text)]/80">
                {(() => {
                  const best = [...monthlyTrend].sort(
                    (a, b) => toFinite(b.balance) - toFinite(a.balance)
                  )[0];
                  return best ? (
                    <>
                      <span className="font-semibold text-lg block mb-1">{best.month}</span>
                      <span className="text-xl font-black text-[color:var(--color-primary)]">
                        {formatCurrency(toFinite(best.balance))}
                      </span>
                    </>
                  ) : (
                    t('finance.charts.noData', { defaultValue: 'No hay datos' })
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
