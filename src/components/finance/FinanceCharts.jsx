import React, { useMemo } from 'react';
import { Card } from '../ui';
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
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

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

const sanitizeTransactions = (transactions) => (Array.isArray(transactions) ? transactions.filter(Boolean) : []);
const sanitizeBudget = (budgetUsage) => (Array.isArray(budgetUsage) ? budgetUsage.filter(Boolean) : []);

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
      const category = tx.category || t('finance.transactions.noCategory', { defaultValue: 'Sin categoría' });
      distribution[category] = toFinite(distribution[category]) + toFinite(tx.amount);
    });
  return Object.entries(distribution)
    .map(([name, value], index) => ({ name, value: toFinite(value), color: COLORS[index % COLORS.length] }))
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
  const expenseDistribution = useMemo(() => buildExpenseDistribution(safeTransactions, t), [safeTransactions, t]);
  const budgetProgress = useMemo(() => buildBudgetProgress(safeBudget), [safeBudget]);

  const totalTransactions = safeTransactions.length;
  const activeCategories = safeBudget.length;
  const efficiency = safeStats.totalBudget > 0 ? Math.round((1 - safeStats.totalSpent / safeStats.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[color:var(--color-text)]">{t('finance.charts.title', { defaultValue: 'Análisis Financiero' })}</h2>
        <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.subtitle', { defaultValue: 'Visualizaciones y tendencias de tus finanzas de boda' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.totalTransactions', { defaultValue: 'Total Transacciones' })}</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{totalTransactions}</p>
        </Card>
        <Card className="p-4 text-center bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.activeCategories', { defaultValue: 'Categorías Activas' })}</p>
          <p className="text-2xl font-bold text-[color:var(--color-primary)]">{activeCategories}</p>
        </Card>
        <Card className="p-4 text-center bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.budgetEfficiency', { defaultValue: 'Eficiencia Presupuesto' })}</p>
          <p className="text-2xl font-bold text-[color:var(--color-success)]">{efficiency}%</p>
        </Card>
        <Card className="p-4 text-center bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <p className="text-sm text-[color:var(--color-text)]/70">{t('finance.charts.projectedBalance', { defaultValue: 'Balance Proyectado' })}</p>
          <p className={`text-2xl font-bold ${safeStats.currentBalance >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>{formatCurrency(safeStats.currentBalance)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.budgetVsSpentByCategory', { defaultValue: 'Presupuesto vs Gastado por Categoría' })}</h3>
          <div className="h-80">
            {hasFiniteForKeys(categoryData, ['presupuestado', 'gastado']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis domain={[0, 'auto']} tickFormatter={(value) => formatCurrency(toFinite(value))} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="presupuestado" fill="var(--color-primary)" name={t('finance.charts.budgeted', { defaultValue: 'Presupuestado' })} />
                  <Bar dataKey="gastado" fill="var(--color-danger)" name={t('finance.charts.spent', { defaultValue: 'Gastado' })} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text)]/70">
                {t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.expenseDistributionByCategory', { defaultValue: 'Distribución de Gastos por Categoría' })}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${Number.isFinite(percent) ? (percent * 100).toFixed(0) : '0'}%`}
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

        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.monthlyTrend', { defaultValue: 'Tendencia Mensual de Ingresos y Gastos' })}</h3>
          <div className="h-80">
            {hasFiniteForKeys(monthlyTrend, ['ingresos', 'gastos', 'balance']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 'auto']} tickFormatter={(value) => formatCurrency(toFinite(value))} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="var(--color-success)" strokeWidth={2} name={t('finance.charts.income', { defaultValue: 'Ingresos' })} />
                  <Line type="monotone" dataKey="gastos" stroke="var(--color-danger)" strokeWidth={2} name={t('finance.charts.expenses', { defaultValue: 'Gastos' })} />
                  <Line type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="5 5" name={t('finance.charts.balance', { defaultValue: 'Balance' })} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text)]/70">
                {t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
          <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.budgetProgressByCategory', { defaultValue: 'Progreso del Presupuesto por Categoría' })}</h3>
          <div className="h-80">
            {hasFiniteForKeys(budgetProgress, ['porcentaje', 'exceso']) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetProgress} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 150]} tickFormatter={(value) => `${toFinite(value)}%`} />
                  <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(toFinite(value)).toFixed(1)}%`,
                      name === 'porcentaje' ? t('finance.charts.used', { defaultValue: 'Usado' }) : t('finance.charts.excess', { defaultValue: 'Exceso' }),
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="porcentaje" fill="var(--color-success)" name={t('finance.charts.used', { defaultValue: 'Usado' })} />
                  <Bar dataKey="exceso" fill="var(--color-danger)" name={t('finance.charts.excess', { defaultValue: 'Exceso' })} />
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

      <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
        <h3 className="text-lg font-medium text-[color:var(--color-text)] mb-4">{t('finance.charts.insights', { defaultValue: 'Insights Financieros' })}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {safeBudget.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-success)]/10">
              <h4 className="font-medium text-[color:var(--color-success)] mb-2">{t('finance.charts.mostEfficient', { defaultValue: 'Más Eficiente' })}</h4>
              <p className="text-sm text-[color:var(--color-success)]/90">
                {(() => {
                  const mostEfficient = safeBudget
                    .filter((cat) => toFinite(cat.amount) > 0)
                    .sort((a, b) => toFinite(a.percentage) - toFinite(b.percentage))[0];
                  return mostEfficient ? (
                    <>
                      <span className="font-medium">{mostEfficient.name}</span>
                      <br />
                      {toFinite(mostEfficient.percentage).toFixed(1)}% {t('finance.overview.used', { defaultValue: 'utilizado' })}
                    </>
                  ) : (
                    t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })
                  );
                })()}
              </p>
            </div>
          )}

          {monthlyTrend.length > 0 && (
            <div className="p-4 rounded-lg bg-[var(--color-primary)]/10">
              <h4 className="font-medium text-[color:var(--color-primary)] mb-2">{t('finance.charts.bestMonth', { defaultValue: 'Mejor Mes' })}</h4>
              <p className="text-sm text-[color:var(--color-primary)]/90">
                {(() => {
                  const best = [...monthlyTrend].sort((a, b) => toFinite(b.balance) - toFinite(a.balance))[0];
                  return best ? (
                    <>
                      <span className="font-medium">{best.month}</span>
                      <br />
                      {formatCurrency(toFinite(best.balance))}
                    </>
                  ) : (
                    t('finance.charts.noData', { defaultValue: 'No hay datos suficientes' })
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
