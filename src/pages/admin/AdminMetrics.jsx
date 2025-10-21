import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { getMetricsData, getHttpMetricsSummary } from '../../services/adminDataService';

const ranges = [
  { label: 'Últimos 7 días', value: '7' },
  { label: 'Últimos 30 días', value: '30' },
  { label: 'Últimos 90 días', value: '90' },
];

const AdminMetrics = () => {
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [iaCosts, setIaCosts] = useState([]);
  const [httpSummary, setHttpSummary] = useState(null);
  const [conversionMetrics, setConversionMetrics] = useState(null);
  const [recurringRevenue, setRecurringRevenue] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [weddingStats, setWeddingStats] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const data = await getMetricsData();
      setSeries(data.series || []);
      setFunnel(data.funnel);
      setIaCosts(data.iaCosts || []);
      setConversionMetrics(data.conversionMetrics);
      setRecurringRevenue(data.recurringRevenue);
      setRetentionData(data.retentionData);
      setUserStats(data.userStats);
      setWeddingStats(data.weddingStats);
      try {
        const http = await getHttpMetricsSummary();
        setHttpSummary(http);
      } catch {}
      setLoading(false);
    };
    loadMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">Métricas globales</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--color-text-soft,#6b7280)]">
            Rango
            <select
              data-testid="metrics-range-selector"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="ml-2 rounded-md border border-soft px-3 py-2 text-sm"
            >
              {ranges.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            data-testid="metrics-export-csv"
            className="rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            data-testid="metrics-export-json"
            className="rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
          >
            Exportar JSON
          </button>
          {httpSummary?.totals && (
            <div
              className="text-xs text-[var(--color-text-soft,#6b7280)]"
              data-testid="metrics-http-summary"
            >
              {`Req ${httpSummary.totals.totalRequests} | Err ${httpSummary.totals.totalErrors} | Rate ${
                typeof httpSummary.totals.errorRate === 'number'
                  ? ((httpSummary.totals.errorRate <= 1
                      ? httpSummary.totals.errorRate * 100
                      : httpSummary.totals.errorRate
                    ).toFixed(1) + '%')
                  : httpSummary.totals.errorRate
              }`}
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
          Cargando métricas...
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
              <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
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
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-soft text-xs text-[var(--color-text-soft,#6b7280)]">
                    Sin datos suficientes
                  </div>
                )}
              </div>
            </article>
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold">Ingresos diarios (últimos 30 días)</h2>
              <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
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
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-soft text-xs text-[var(--color-text-soft,#6b7280)]">
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
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{step.percentage}</p>
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
