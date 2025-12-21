// ARCHIVO GENERADO - Implementación completa de métricas con tabs
// Ver docs/admin/METRICAS-RECOMENDADAS.md para documentación

import React, { useEffect, useState, useId } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getMetricsData, getProductMetrics } from '../../services/adminDataService';

const TABS = [
  { id: 'resumen', label: '📊 Resumen' },
  { id: 'producto', label: '📱 Producto' },
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
        <p className="text-xs text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

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
      <h1 className="text-xl font-semibold">Métricas MaLoveApp</h1>
      
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
        <div className="py-12 text-center text-gray-500">Cargando métricas...</div>
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
          title="MRR"
          value={`€${data.main?.recurringRevenue?.mrr?.toFixed(0) || 0}`}
          color="green"
          description="Ingreso recurrente mensual generado por suscripciones activas."
        />
        <KPICard
          title="Bodas Activas"
          value={formatNumber(data.main?.weddingStats?.active || 0)}
          color="blue"
          description="Eventos que registraron actividad durante el periodo seleccionado."
        />
        <KPICard
          title="DAU/MAU"
          value={`${formatNumber(Math.round(data.main?.userStats?.dau || 0))}/${formatNumber(data.main?.userStats?.mau || 0)}`}
          color="purple"
          description="Relación entre usuarios activos diarios y mensuales para medir engagement."
        />
        <KPICard
          title="D7 Retention"
          value={formatPercentage(data.main?.retentionData?.d7 || 0, 0)}
          color="pink"
          description="Porcentaje de usuarios que regresan siete días después de su activación."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Bodas finalizadas"
          value={formatNumber(weddingProgress.finished || 0)}
          description="Bodas que ya no están activas en el sistema (archivadas o finalizadas)."
        />
        <KPICard
          title="Bodas completadas"
          value={formatNumber(weddingProgress.completed || 0)}
          color="green"
          description="Bodas finalizadas con todas las tareas principales resueltas."
        />
        <KPICard
          title="% completadas"
          value={formatPercentage(weddingProgress.completionRate || 0)}
          color="blue"
          description="Relación entre bodas completadas y total de bodas finalizadas."
        />
        <KPICard
          title="Tareas completadas (media)"
          value={formatPercentage(tasksCompletion.averageCompletionPercent || 0)}
          color="purple"
          description="Promedio de progresos de tareas marcadas como hechas por boda."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Descargas totales app"
          value={formatNumber(data.main?.downloads?.total || 0)}
          description="Descargas acumuladas entre Play Store, App Store y fuentes internas."
        />
        <KPICard
          title="Descargas últimos 30 días"
          value={formatNumber(data.main?.downloads?.last30d || 0)}
          color="blue"
          description="Descargas recientes registradas durante el último mes."
        />
        <KPICard
          title="Altas totales"
          value={formatNumber(userAcquisition.total || 0)}
          color="orange"
          description="Usuarios que han creado cuenta en cualquier momento."
        />
        <KPICard
          title="Altas de pago"
          value={formatNumber(userAcquisition.paidTotal || 0)}
          color="green"
          description="Usuarios que han escogido un plan de pago desde el alta."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Planners activos"
          value={formatNumber(plannerStats.totalPlanners || 0)}
          color="purple"
          description="Número de planners únicos que gestionan bodas activas."
        />
        {topPlannerEntry && (
          <KPICard
            title="Planner con más bodas"
            value={formatNumber(topPlannerEntry.count || 0)}
            description={`ID planner: ${topPlannerEntry.plannerId || 'Sin asignar'}`}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Bodas con Momentos activo"
          value={formatNumber(momentosUsage.weddingsWithMoments || 0)}
          color="indigo"
          description="Bodas que tienen habilitado el plan Momentos."
        />
        <KPICard
          title="Uso medio Momentos"
          value={formatGigabytes(momentosUsage.averageGigabytes || 0)}
          color="indigo"
          description="Gigabytes medios consumidos en fotos/vídeos por bodas con Momentos."
        />
        <KPICard
          title="Uso total Momentos"
          value={formatGigabytes(momentosUsage.totalGigabytes || 0)}
          description="Almacenamiento total destinado a Momentos entre todas las bodas activas."
        />
      </div>

      {downloadsMonthly.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Descargas app (últimos {downloadsMonthly.length} meses)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={downloadsMonthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Descargas" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tasksSample.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Muestra de progreso por bodas</h3>
          <ul className="space-y-2 text-sm text-gray-600">
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
        <h3 className="font-semibold mb-3">Explora los tabs para más detalle</h3>
        <p className="text-sm text-gray-600">
          Producto: adopción de funcionalidades y altas mensuales · Económicas: revenue, CAC y LTV · Técnicas: performance y uptime · Soporte: tickets y satisfacción.
        </p>
      </div>
    </div>
  );
};

const ProductoTab = ({ data }) => {
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
          title="Usuarios"
          value={formatNumber(data.main?.userStats?.total || 0)}
          description="Total de cuentas registradas con acceso al sistema."
        />
        <KPICard
          title="Activos 7d"
          value={formatNumber(data.main?.userStats?.active7d || 0)}
          color="green"
          description="Usuarios con actividad registrada en los últimos siete días."
        />
        <KPICard
          title="MAU"
          value={formatNumber(data.main?.userStats?.mau || 0)}
          color="blue"
          description="Usuarios únicos activos durante los últimos 30 días."
        />
        <KPICard
          title="Nuevos (30d)"
          value={formatNumber(data.product?.newRegistrations?.last30days || 0)}
          color="purple"
          description="Altas confirmadas en el último mes."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Altas totales"
          value={formatNumber(userAcquisition.total || 0)}
          color="orange"
          description="Usuarios registrados en el periodo analizado."
        />
        <KPICard
          title="Altas de pago"
          value={formatNumber(userAcquisition.paidTotal || 0)}
          color="green"
          description="Nuevos usuarios con plan de pago activo."
        />
        <KPICard
          title="Descargas totales app"
          value={formatNumber(data.main?.downloads?.total || 0)}
          description="Descargas únicas acumuladas reportadas por los distintos canales."
        />
        <KPICard
          title="Descargas últimos 30d"
          value={formatNumber(data.main?.downloads?.last30d || 0)}
          color="blue"
          description="Descargas registradas durante los últimos 30 días."
        />
      </div>

      {data.product?.featureAdoption && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Adopción de Features</h3>
          {Object.entries(data.product.featureAdoption).map(([feature, pct]) => (
            <div
              key={feature}
              className="mb-2"
              title={`Porcentaje de usuarios activos que usan ${feature}.`}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="capitalize">{feature}</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {userMonthlyData.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Altas mensuales</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name="Totales" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="paid" name="Pago" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {Array.isArray(plannerStats.top) && plannerStats.top.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Top planners por volumen de bodas</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            {plannerStats.top.map((entry, index) => (
              <li key={`${entry.plannerId || 'sin_asignar'}-${index}`} className="flex items-center justify-between">
                <span>
                  <span className="font-medium mr-2">{index + 1}.</span>
                  {entry.plannerId || 'Sin asignar'}
                </span>
                <span>{formatNumber(entry.count || 0)} bodas</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default AdminMetricsComplete;
