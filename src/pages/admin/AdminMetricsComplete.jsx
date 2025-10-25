// ARCHIVO GENERADO - Implementación completa de métricas con tabs
// Ver docs/admin/METRICAS-RECOMENDADAS.md para documentación

import React, { useEffect, useState, useId } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getMetricsData, getHttpMetricsSummary, getProductMetrics, getTechnicalMetrics, getEconomicMetrics, getSupportData } from '../../services/adminDataService';
import { useTranslations } from '../../hooks/useTranslations';

const TABS = [
  {
  const { t } = useTranslations();
 id: 'resumen', label: '📊 Resumen' },
  { id: 'producto', label: '📱 Producto' },
  { id: 'economicas', label: t('common.economicas') },
  { id: 'tecnicas', label: t('common.tecnicas') },
  { id: 'soporte', label: '🎫 Soporte' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// KPICard component (fuera del componente principal para ser accesible por todos los tabs)
const KPICard = ({ title, value, subtitle, color = 'gray', description = '' }) => {
  const bgClass = color === 'gray' ? 'bg-white' : `bg-${color}-50`;
  const textClass = color === 'gray' ? 'text-gray-900' : `text-${color}-700`;
  const tooltipId = useId();
  const hasTooltip = Boolean(description);
  
  return (
    <div className="relative group">
      <div
        className={`rounded-lg border p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/40 ${bgClass}`}
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
        const [main, product, technical, economic, http, support] = await Promise.all([
          getMetricsData(),
          getProductMetrics(),
          getTechnicalMetrics(),
          getEconomicMetrics(),
          getHttpMetricsSummary().catch(() => null),
          getSupportData().catch(() => null)
        ]);
        setData({ main, product, technical, economic, http, support });
      } catch (error) {
        console.error('Error loading metrics:', error);
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
          {activeTab === 'economicas' && <EconomicasTab data={data} />}
          {activeTab === 'tecnicas' && <TecnicasTab data={data} />}
          {activeTab === 'soporte' && <SoporteTab data={data} />}
        </div>
      )}
    </div>
  );
};

// TAB COMPONENTS
const ResumenTab = ({ data }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-5">
      <KPICard
        title="MRR"
        value={`€${data.main?.recurringRevenue?.mrr?.toFixed(0) || 0}`}
        color="green"
        description="Ingreso recurrente mensual generado por suscripciones activas."
      />
      <KPICard
        title="Bodas Activas"
        value={data.main?.weddingStats?.active || 0}
        color="blue"
        description="Eventos que registraron actividad durante el periodo seleccionado."
      />
      <KPICard
        title="DAU/MAU"
        value={`${Math.round(data.main?.userStats?.dau || 0)}/${data.main?.userStats?.mau || 0}`}
        color="purple"
        description={t('common.relacion_entre_usuarios_activos_diarios')}
      />
      <KPICard
        title="CAC:LTV"
        value={data.economic?.cacLtvRatio || '0:1'}
        color="orange"
        description="Comparativa entre el coste de adquirir un cliente y el valor de vida estimado."
      />
      <KPICard
        title="D7 Retention"
        value={`${data.main?.retentionData?.d7 || 0}%`}
        color="pink"
        description={t('common.porcentaje_usuarios_que_regresan_siete')}
      />
    </div>
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold mb-3">Ver tabs específicos para más detalles</h3>
      <p className="text-sm text-gray-600">Producto: Feature adoption, engagement | Económicas: Revenue breakdown | Técnicas: Performance | Soporte: Tickets, NPS</p>
    </div>
  </div>
);

const ProductoTab = ({ data }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard
        title="Usuarios"
        value={data.main?.userStats?.total || 0}
        description="Total de cuentas registradas con acceso al sistema."
      />
      <KPICard
        title="Activos 7d"
        value={data.main?.userStats?.active7d || 0}
        color="green"
        description={t('common.usuarios_con_actividad_registrada_los')}
      />
      <KPICard
        title="MAU"
        value={data.main?.userStats?.mau || 0}
        color="blue"
        description={t('common.usuarios_unicos_activos_durante_los')}
      />
      <KPICard
        title="Nuevos (30d)"
        value={data.product?.newRegistrations?.last30days || 0}
        color="purple"
        description={t('common.altas_confirmadas_ultimo_mes')}
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
  </div>
);

const EconomicasTab = ({ data }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard
        title="MRR"
        value={`€${data.main?.recurringRevenue?.mrr?.toFixed(2) || 0}`}
        color="green"
        subtitle={`${data.main?.recurringRevenue?.activeSubscriptions || 0} subs`}
        description="Ingreso recurrente mensual neto basado en suscripciones activas."
      />
      <KPICard
        title="ARR"
        value={`€${data.main?.recurringRevenue?.arr?.toFixed(2) || 0}`}
        color="green"
        description={t('common.proyeccion_anual_del_ingreso_recurrente')}
      />
      <KPICard
        title="CAC"
        value={`€${data.economic?.cac?.toFixed(2) || 0}`}
        color="orange"
        description="Coste medio invertido para adquirir un nuevo cliente."
      />
      <KPICard
        title="LTV"
        value={`€${data.economic?.ltv || 0}`}
        color="blue"
        description="Ingresos esperados por cliente a lo largo de su ciclo de vida."
      />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <KPICard
        title="Ratio CAC:LTV"
        value={data.economic?.cacLtvRatio || '0:1'}
        color="purple"
        subtitle={parseFloat(data.economic?.cacLtvRatio) >= 3 ? 'Saludable' : 'Revisar'}
        description={t('common.relacion_entre_valor_vida_coste')}
      />
      <KPICard
        title="Payback Period"
        value={`${data.economic?.paybackPeriod || 0} meses`}
        color="indigo"
        description="Meses necesarios para recuperar el CAC con los ingresos recurrentes."
      />
    </div>
    {data.main?.conversionMetrics && (
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Conversión Owner → Planner</h3>
        <div className="grid gap-4 md:grid-cols-4 text-center">
          <div title={t('common.numero_total_cuentas_owner_evaluadas')}>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold">{data.main.conversionMetrics.totalOwners}</p>
          </div>
          <div title={t('common.owners_que_realizaron_conversion_planner')}>
            <p className="text-xs text-gray-600">Convertidos</p>
            <p className="text-xl font-bold text-green-600">{data.main.conversionMetrics.converted}</p>
          </div>
          <div title={t('common.porcentaje_owners_que_completaron_conversion')}>
            <p className="text-xs text-gray-600">Tasa</p>
            <p className="text-xl font-bold text-blue-600">{data.main.conversionMetrics.conversionRate}%</p>
          </div>
          <div title={t('common.dias_promedio_que_tarda_owner')}>
            <p className="text-xs text-gray-600">Días</p>
            <p className="text-xl font-bold">{data.main.conversionMetrics.avgDaysToConvert?.toFixed(0) || 0}d</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

const TecnicasTab = ({ data }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard
        title="Uptime"
        value={`${data.technical?.uptime?.toFixed(2) || 0}%`}
        color="green"
        description="Porcentaje de tiempo que la plataforma estuvo operativa."
      />
      <KPICard
        title="Error Rate"
        value={`${data.technical?.errorRate?.toFixed(2) || 0}%`}
        color={data.technical?.errorRate > 1 ? 'red' : 'green'}
        description="Porcentaje de peticiones con error sobre el total."
      />
      <KPICard
        title="Avg Response"
        value={`${data.technical?.avgResponseTime || 0}ms`}
        color="blue"
        description="Tiempo medio que tarda el backend en responder."
      />
      <KPICard
        title="Requests"
        value={data.http?.totals?.totalRequests || 0}
        color="purple"
        description="Total de solicitudes HTTP procesadas en el periodo."
      />
    </div>
    {data.technical?.performance && (
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Core Web Vitals</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-3 bg-gray-50 rounded" title="Largest Contentful Paint: tiempo hasta que se muestra el contenido principal.">
            <p className="text-xs text-gray-600">LCP</p>
            <p className="text-2xl font-bold text-green-600">{data.technical.performance.lcp}s</p>
            <p className="text-xs text-gray-500">Target: 2.5s</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded" title="First Input Delay: tiempo entre la interacción del usuario y la respuesta del navegador.">
            <p className="text-xs text-gray-600">FID</p>
            <p className="text-2xl font-bold text-green-600">{data.technical.performance.fid}ms</p>
            <p className="text-xs text-gray-500">Target: 100ms</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded" title="Cumulative Layout Shift: estabilidad visual acumulada de la página.">
            <p className="text-xs text-gray-600">CLS</p>
            <p className="text-2xl font-bold text-green-600">{data.technical.performance.cls}</p>
            <p className="text-xs text-gray-500">Target: 0.1</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded" title="Time To First Byte: tiempo hasta recibir el primer byte del servidor.">
            <p className="text-xs text-gray-600">TTFB</p>
            <p className="text-2xl font-bold text-blue-600">{data.technical.performance.ttfb}ms</p>
            <p className="text-xs text-gray-500">Target: 200ms</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

const SoporteTab = ({ data }) => {
  const summary = data.support?.summary;
  const tickets = Array.isArray(data.support?.tickets) ? data.support.tickets : [];

  return (
    <div className="space-y-6">
      {summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <KPICard title="Tickets abiertos" value={summary.open ?? 0} color="red" />
            <KPICard title="Tickets pendientes" value={summary.pending ?? 0} color="amber" />
            <KPICard title="Tickets resueltos" value={summary.resolved ?? 0} color="green" />
            <KPICard
              title="SLA promedio"
              value={summary.slaAverage || '—'}
              color="blue"
              subtitle={`Actualizado ${summary.updatedAt || ''}`}
            />
            {typeof summary.nps === 'number' && (
              <KPICard title="NPS" value={summary.nps} color="purple" />
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Tickets recientes</h3>
            {tickets.length > 0 ? (
              <ul className="divide-y divide-soft">
                {tickets.slice(0, 8).map((ticket) => (
                  <li key={ticket.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.subject || 'Sin asunto'}</p>
                      <p className="text-xs text-gray-500">
                        {ticket.requester ? `${ticket.requester} • ` : ''}
                        {ticket.updatedAt || {t('common.actualizacion_desconocida')}}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {ticket.priority && (
                        <span className="rounded-full border border-soft px-2 py-0.5 uppercase tracking-wide">
                          {ticket.priority}
                        </span>
                      )}
                      {ticket.status && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 uppercase tracking-wide text-gray-700">
                          {ticket.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Sin tickets recientes en la bandeja de soporte.</p>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Soporte y Satisfacción</h3>
          <p className="text-sm text-gray-600">Aún no hay métricas de soporte disponibles.</p>
        </div>
      )}
    </div>
  );
};

export default AdminMetricsComplete;
