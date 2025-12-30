import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

import { getMetricsData, getHttpMetricsSummary, getProductMetrics, getTechnicalMetrics, getEconomicMetrics } from '../../services/adminDataService';

const TABS = [
  { id: 'resumen', label: '📊 Resumen', icon: '📊' },
  { id: 'producto', label: '📱 Producto', icon: '📱' },
  { id: 'economicas', label: '💰 Económicas', icon: '💰' },
  { id: 'tecnicas', label: '⚙️ Técnicas', icon: '⚙️' },
  { id: 'soporte', label: '🎫 Soporte', icon: '🎫' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminMetrics = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  
  // Datos principales
  const [series, setSeries] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [iaCosts, setIaCosts] = useState([]);
  const [httpSummary, setHttpSummary] = useState(null);
  const [conversionMetrics, setConversionMetrics] = useState(null);
  const [recurringRevenue, setRecurringRevenue] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [weddingStats, setWeddingStats] = useState(null);
  
  // Métricas adicionales
  const [productMetrics, setProductMetrics] = useState(null);
  const [technicalMetrics, setTechnicalMetrics] = useState(null);
  const [economicMetrics, setEconomicMetrics] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const [mainData, productData, technicalData, economicData, httpData] = await Promise.all([
          getMetricsData(),
          getProductMetrics(),
          getTechnicalMetrics(),
          getEconomicMetrics(),
          getHttpMetricsSummary().catch(() => null)
        ]);
        
        setSeries(mainData.series || []);
        setFunnel(mainData.funnel);
        setIaCosts(mainData.iaCosts || []);
        setConversionMetrics(mainData.conversionMetrics);
        setRecurringRevenue(mainData.recurringRevenue);
        setRetentionData(mainData.retentionData);
        setUserStats(mainData.userStats);
        setWeddingStats(mainData.weddingStats);
        
        setProductMetrics(productData);
        setTechnicalMetrics(technicalData);
        setEconomicMetrics(economicData);
        setHttpSummary(httpData);
      } catch (error) {
        // console.error('[AdminMetrics] Error loading metrics:', error);
      }
      setLoading(false);
    };
    loadMetrics();
  }, []);

  // Renderizar tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold mb-4">Métricas MaLoveApp</h1>
        {renderTabs()}
      </header>

      {loading ? (
        <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
          {t('admin.metrics.searchPlaceholder')}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {(userStats || weddingStats) && (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {userStats && (
                <>
                  <div className="rounded-xl border border-soft bg-surface px-4 py-4 shadow-sm">
                    <p className="text-xs text-gray-500">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.total || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">📊 {userStats.source || 'realtime'}</p>
                  </div>
                  <div className="rounded-xl border border-soft bg-green-50 px-4 py-4 shadow-sm">
                    <p className="text-xs text-green-600">Activos 7 días</p>
                    <p className="text-2xl font-bold text-green-700">{userStats.active7d || 0}</p>
                    <p className="text-xs text-green-500 mt-1">
                      {userStats.total > 0 ? `${((userStats.active7d / userStats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </>
              )}
              {weddingStats && (
                <>
                  <div className="rounded-xl border border-soft bg-surface px-4 py-4 shadow-sm">
                    <p className="text-xs text-gray-500">Total Bodas</p>
                    <p className="text-2xl font-bold text-gray-900">{weddingStats.total || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">💍 {weddingStats.source || 'realtime'}</p>
                  </div>
                  <div className="rounded-xl border border-soft bg-blue-50 px-4 py-4 shadow-sm">
                    <p className="text-xs text-blue-600">Bodas Activas</p>
                    <p className="text-2xl font-bold text-blue-700">{weddingStats.active || 0}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {weddingStats.total > 0 ? `${((weddingStats.active / weddingStats.total) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Charts */}
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold">Usuarios activos (últimos 30 días)</h2>
              <p className="mt-2 text-xs text-[color:var(--color-text-soft)]">
                Distribución diaria de usuarios activos
              </p>
              <div className="mt-4 h-64">
                {series.length > 0 && series[0]?.data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series[0].data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#93c5fd" name={series[0].label || 'Usuarios'} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-soft text-xs text-[color:var(--color-text-soft)]">
                    Sin datos suficientes
                  </div>
                )}
              </div>
            </article>
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold">Ingresos diarios (últimos 30 días)</h2>
              <p className="mt-2 text-xs text-[color:var(--color-text-soft)]">
                Evolución de ingresos en {iaCosts[0]?.currency || 'EUR'}
              </p>
              <div className="mt-4 h-64">
                {iaCosts.length > 0 && iaCosts[0]?.data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={iaCosts[0].data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#10b981" name={iaCosts[0].label || 'Ingresos'} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-soft text-xs text-[color:var(--color-text-soft)]">
                    Sin datos suficientes
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm" data-testid="metrics-funnel">
            <h2 className="text-sm font-semibold">Funnel conversión</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Array.isArray(funnel) && funnel.length > 0 ? (
                funnel.map((step, index) => (
                  <div key={step.label || index} className="rounded-lg border border-soft px-3 py-4 text-sm">
                    <p className="font-medium">{step.label}</p>
                    <p className="text-2xl font-semibold">{step.value}</p>
                    <p className="text-xs text-[color:var(--color-text-soft)]">{step.percentage}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-sm text-gray-500">Sin datos de funnel disponibles</div>
              )}
            </div>
          </section>

          {/* Advanced Metrics */}
          <section className="grid gap-4 md:grid-cols-3">
            {conversionMetrics && (
              <div className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">Conversión Owner → Planner</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total Owners:</span>
                    <span className="font-medium">{conversionMetrics.totalOwners || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Convertidos:</span>
                    <span className="font-medium text-green-600">{conversionMetrics.converted || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tasa:</span>
                    <span className="font-bold text-lg text-blue-600">{conversionMetrics.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tiempo medio:</span>
                    <span className="font-medium">{conversionMetrics.avgDaysToConvert?.toFixed(1) || 0} días</span>
                  </div>
                </div>
              </div>
            )}
            {recurringRevenue && (
              <div className="rounded-xl border border-soft bg-green-50 px-4 py-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-green-700">Ingresos Recurrentes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">MRR:</span>
                    <span className="font-bold text-lg text-green-700">{recurringRevenue.mrr?.toFixed(2) || 0} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">ARR:</span>
                    <span className="font-bold text-lg text-green-700">{recurringRevenue.arr?.toFixed(2) || 0} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Suscripciones:</span>
                    <span className="font-medium">{recurringRevenue.activeSubscriptions || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Ticket medio:</span>
                    <span className="font-medium">{recurringRevenue.avgTicket?.toFixed(2) || 0} €</span>
                  </div>
                </div>
              </div>
            )}
            {retentionData && (
              <div className="rounded-xl border border-soft bg-purple-50 px-4 py-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-purple-700">Retención de Usuarios</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600">Día 1:</span>
                    <span className="font-bold text-lg text-purple-700">{retentionData.d1}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600">Día 7:</span>
                    <span className="font-bold text-lg text-purple-700">{retentionData.d7}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600">Día 30:</span>
                    <span className="font-bold text-lg text-purple-700">{retentionData.d30}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-600">Total usuarios:</span>
                    <span className="font-medium">{retentionData.totalUsers || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminMetrics;
