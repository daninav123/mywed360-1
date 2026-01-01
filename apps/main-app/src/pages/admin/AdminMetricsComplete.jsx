// ARCHIVO GENERADO - Implementación completa de métricas con tabs
// Ver docs/admin/METRICAS-RECOMENDADAS.md para documentación

import React, { useEffect, useState, useId } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getMetricsData, getProductMetrics } from '../../services/adminDataService';
import { useTranslation } from 'react-i18next';

const getTabs = (t) => [
  { id: 'resumen', label: t('admin:metrics.tabs.summary') },
  { id: 'producto', label: t('admin:metrics.tabs.product') },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const numberFormatter = new Intl.NumberFormat('es-ES');
const formatNumber = (value) => numberFormatter.format(Math.round(Number(value) || 0));
const formatDecimal = (value, digits = 1) => Number(value || 0).toFixed(digits);
const formatPercentage = (value, digits = 1) => `${formatDecimal(value, digits)}%`;
const formatGigabytes = (value, digits = 2) => `${formatDecimal(value, digits)} GB`;

// KPICard component (fuera del componente principal para ser accesible por todos los tabs)
const KPICard = ({ title, value, subtitle, color = 'gray', description = '' }) => {
  const bgClass = color === 'gray' ? 'bg-white' : `bg-${color}-50`;
  const textClass = color === 'gray' ? 'text-gray-900' : `text-${color}-700`;
  const tooltipId = useId();
  const hasTooltip = Boolean(description);
  
  return (
    <div className="relative group">
      <div
        className={`rounded-lg border p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary-40)] ${bgClass}`}
        aria-label={hasTooltip ? description : title}
        aria-describedby={hasTooltip ? tooltipId : undefined}
        tabIndex={hasTooltip ? 0 : undefined}
      >
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
        <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
        {subtitle && <p className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>}
      </div>
      {hasTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-3 w-56 -translate-x-1/2 translate-y-1 rounded-lg border border-soft bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-text)] shadow-lg opacity-0 transition-all duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          {description}
          <span className="pointer-events-none absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 border border-soft bg-[color:var(--color-surface)] shadow-md"></span>
        </div>
      )}
    </div>
  );
};

const AdminMetricsComplete = () => {
  const { t } = useTranslation(['admin']);
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const TABS = getTabs(t);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [main, product] = await Promise.all([
          getMetricsData(),
          getProductMetrics(),
        ]);
        setData({ main, product });
      } catch (error) {
        // console.error('Error loading metrics:', error);
      }
      setLoading(false);
    };
    loadAll();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('admin:metrics.title')}</h1>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center " style={{ color: 'var(--color-muted)' }}>{t('admin:metrics.loading')}</div>
      ) : (
        <div>
          {activeTab === 'resumen' && <ResumenTab data={data} />}
          {activeTab === 'producto' && <ProductoTab data={data} />}
        </div>
      )}
    </div>
  );
};

// TAB COMPONENTS
const ResumenTab = ({ data }) => {
  const { t } = useTranslation(['admin']);
  const downloadsMonthly = Array.isArray(data.main?.downloads?.byMonth)
    ? data.main.downloads.byMonth.map((entry) => ({
        month: entry.month,
        value: Number(entry.value || 0),
      }))
    : [];
  const tasksSample = Array.isArray(data.main?.tasksCompletion?.sample)
    ? data.main.tasksCompletion.sample
    : [];
  const weddingProgress = data.main?.weddingProgress || {};
  const tasksCompletion = data.main?.tasksCompletion || {};
  const momentosUsage = data.main?.momentosUsage || {};
  const userAcquisition = data.main?.userAcquisition || {};
  const plannerStats = data.main?.plannerStats || {};
  const topPlannerEntry =
    Array.isArray(plannerStats.top) && plannerStats.top.length > 0 ? plannerStats.top[0] : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t('admin:metrics.kpi.mrr')}
          value={`€${data.main?.recurringRevenue?.mrr?.toFixed(0) || 0}`}
          color="green"
          description={t('admin:metrics.kpi.mrrDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.activeWeddings')}
          value={formatNumber(data.main?.weddingStats?.active || 0)}
          color="blue"
          description={t('admin:metrics.kpi.activeWeddingsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.dauMau')}
          value={`${formatNumber(Math.round(data.main?.userStats?.dau || 0))}/${formatNumber(data.main?.userStats?.mau || 0)}`}
          color="purple"
          description={t('admin:metrics.kpi.dauMauDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.d7Retention')}
          value={formatPercentage(data.main?.retentionData?.d7 || 0, 0)}
          color="pink"
          description={t('admin:metrics.kpi.d7RetentionDesc')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t('admin:metrics.kpi.finishedWeddings')}
          value={formatNumber(weddingProgress.finished || 0)}
          description={t('admin:metrics.kpi.finishedWeddingsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.completedWeddings')}
          value={formatNumber(weddingProgress.completed || 0)}
          color="green"
          description={t('admin:metrics.kpi.completedWeddingsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.completionRate')}
          value={formatPercentage(weddingProgress.completionRate || 0)}
          color="blue"
          description={t('admin:metrics.kpi.completionRateDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.avgTasksCompleted')}
          value={formatPercentage(tasksCompletion.averageCompletionPercent || 0)}
          color="purple"
          description={t('admin:metrics.kpi.avgTasksCompletedDesc')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t('admin:metrics.kpi.totalDownloads')}
          value={formatNumber(data.main?.downloads?.total || 0)}
          description={t('admin:metrics.kpi.totalDownloadsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.downloads30d')}
          value={formatNumber(data.main?.downloads?.last30d || 0)}
          color="blue"
          description={t('admin:metrics.kpi.downloads30dDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.totalSignups')}
          value={formatNumber(userAcquisition.total || 0)}
          color="orange"
          description={t('admin:metrics.kpi.totalSignupsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.paidSignups')}
          value={formatNumber(userAcquisition.paidTotal || 0)}
          color="green"
          description={t('admin:metrics.kpi.paidSignupsDesc')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title={t('admin:metrics.kpi.activePlanners')}
          value={formatNumber(plannerStats.totalPlanners || 0)}
          color="purple"
          description={t('admin:metrics.kpi.activePlannersDesc')}
        />
        {topPlannerEntry && (
          <KPICard
            title={t('admin:metrics.kpi.topPlanner')}
            value={formatNumber(topPlannerEntry.count || 0)}
            description={t('admin:metrics.kpi.topPlannerDesc', { id: topPlannerEntry.plannerId || t('admin:metrics.charts.unassigned') })}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title={t('admin:metrics.kpi.weddingsWithMomentos')}
          value={formatNumber(momentosUsage.weddingsWithMoments || 0)}
          color="indigo"
          description={t('admin:metrics.kpi.weddingsWithMomentosDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.avgMomentosUsage')}
          value={formatGigabytes(momentosUsage.averageGigabytes || 0)}
          color="indigo"
          description={t('admin:metrics.kpi.avgMomentosUsageDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.totalMomentosUsage')}
          value={formatGigabytes(momentosUsage.totalGigabytes || 0)}
          description={t('admin:metrics.kpi.totalMomentosUsageDesc')}
        />
      </div>

      {downloadsMonthly.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">{t('admin:metrics.charts.appDownloads', { count: downloadsMonthly.length })}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={downloadsMonthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name={t('admin:metrics.charts.downloads')} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tasksSample.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">{t('admin:metrics.charts.progressSample')}</h3>
          <ul className="space-y-2 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
            {tasksSample.map((sample) => (
              <li key={sample.weddingId} className="flex items-center justify-between">
                <span className="font-medium">
                  {sample.name || sample.weddingId}
                </span>
                <span>
                  {formatPercentage(sample.completionPercent || 0)} ({formatNumber(sample.tasksCompleted || 0)} / {formatNumber(sample.tasksTotal || 0)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">{t('admin:metrics.charts.exploreTitle')}</h3>
        <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
          {t('admin:metrics.charts.exploreDesc')}
        </p>
      </div>
    </div>
  );
};

const ProductoTab = ({ data }) => {
  const { t } = useTranslation(['admin']);
  const userAcquisition = data.main?.userAcquisition || {};
  const userMonthlyData = Array.isArray(userAcquisition.byMonth)
    ? userAcquisition.byMonth.map((entry) => {
        const paidMatch = Array.isArray(userAcquisition.paidByMonth)
          ? userAcquisition.paidByMonth.find((paid) => paid.month === entry.month)
          : null;
        return {
          month: entry.month,
          total: Number(entry.value || 0),
          paid: Number(paidMatch?.value || 0),
        };
      })
    : [];
  const plannerStats = data.main?.plannerStats || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t('admin:metrics.kpi.users')}
          value={formatNumber(data.main?.userStats?.total || 0)}
          description={t('admin:metrics.kpi.usersDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.active7d')}
          value={formatNumber(data.main?.userStats?.active7d || 0)}
          color="green"
          description={t('admin:metrics.kpi.active7dDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.mau')}
          value={formatNumber(data.main?.userStats?.mau || 0)}
          color="blue"
          description={t('admin:metrics.kpi.mauDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.new30d')}
          value={formatNumber(data.product?.newRegistrations?.last30days || 0)}
          color="purple"
          description={t('admin:metrics.kpi.new30dDesc')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title={t('admin:metrics.kpi.totalSignups')}
          value={formatNumber(userAcquisition.total || 0)}
          color="orange"
          description={t('admin:metrics.kpi.totalSignupsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.paidTotal')}
          value={formatNumber(userAcquisition.paidTotal || 0)}
          color="green"
          description={t('admin:metrics.kpi.paidTotalDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.totalDownloads')}
          value={formatNumber(data.main?.downloads?.total || 0)}
          description={t('admin:metrics.kpi.totalDownloadsDesc')}
        />
        <KPICard
          title={t('admin:metrics.kpi.downloads30d')}
          value={formatNumber(data.main?.downloads?.last30d || 0)}
          color="blue"
          description={t('admin:metrics.kpi.downloads30dDesc')}
        />
      </div>

      {data.product?.featureAdoption && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">{t('admin:metrics.charts.featureAdoption')}</h3>
          {Object.entries(data.product.featureAdoption).map(([feature, pct]) => (
            <div
              key={feature}
              className="mb-2"
              title={t('admin:metrics.charts.featureAdoptionDesc', { feature })}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize">{feature}</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className=" h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {userMonthlyData.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">{t('admin:metrics.charts.monthlySignups')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name={t('admin:metrics.charts.total')} stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="paid" name={t('admin:metrics.charts.paid')} stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {Array.isArray(plannerStats.top) && plannerStats.top.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">{t('admin:metrics.charts.topPlanners')}</h3>
          <ol className="space-y-2 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
            {plannerStats.top.map((entry, index) => (
              <li key={`${entry.plannerId || 'sin_asignar'}-${index}`} className="flex items-center justify-between">
                <span>
                  <span className="font-medium mr-2">{index + 1}.</span>
                  {entry.plannerId || t('admin:metrics.charts.unassigned')}
                </span>
                <span>{formatNumber(entry.count || 0)} {t('admin:metrics.charts.weddings')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default AdminMetricsComplete;
