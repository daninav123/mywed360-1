import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { get as apiGet } from '../../services/apiClient';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { getAdminFetchOptions } from '../../services/adminSession';

/**
 * Dashboard para visualizar mtricas de rendimiento del sistema
 * Especialmente enfocado en el sistema de correo electrnico personalizado
 *
 * @component
 * @example
 * ```jsx
 * <MetricsDashboard />
 * ```
 */
function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('day'); // day, week, month
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorList, setErrorList] = useState([]);
  const [errorFilterText, setErrorFilterText] = useState('');
  const [errorFilterSource, setErrorFilterSource] = useState('all');
  const [errorFilterType, setErrorFilterType] = useState('all');
  const [aggregate, setAggregate] = useState({ counters: {}, timings: {}, eventsTotal: 0 });
  const [webVitals, setWebVitals] = useState([]);

  // Colores para grficos
  const colors = {
    email: '#8884d8',
    search: '#82ca9d',
    notification: '#ffc658',
    eventDetection: '#ff8042',
    error: '#ff0000',
  };

  const buildAdminApiOptions = (extra = {}) =>
    getAdminFetchOptions({ auth: false, silent: true, ...extra });

  // Cargar datos de mtricas al montar el componente
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Intentar obtener mtricas de localStorage (modo desarrollo)
        let localMetrics = null;
        try {
          const storedMetrics = localStorage.getItem('mywed360_last_metrics');
          if (storedMetrics) {
            localMetrics = JSON.parse(storedMetrics);
          }
        } catch (e) {
          console.log('No se encontraron mtricas locales');
        }

        // Si hay un endpoint de mtricas configurado, obtener de all
        let remoteMetrics = null;
        const metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT;

        if (metricsEndpoint) {
          const response = await fetch(
            `${metricsEndpoint}/dashboard?timeframe=${selectedTimeframe}`,
            getAdminFetchOptions()
          );
          if (response.ok) {
            remoteMetrics = await response.json();
          } else {
            throw new Error(`Error al obtener mtricas: ${response.statusText}`);
          }
        }

        // Usar mtricas remotas si estn disponibles, sino las locales (sin mocks)
        setMetrics(
          remoteMetrics ||
            localMetrics || {
              timeSeriesData: [],
              performanceData: {},
              errorData: [],
              usageData: [],
              timestamp: Date.now(),
            }
        );
      } catch (err) {
        try {
          const metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT;
          if (metricsEndpoint) {
            const resp = await apiGet(
              `${metricsEndpoint}/dashboard?timeframe=${selectedTimeframe}`,
              buildAdminApiOptions()
            );
            if (resp?.ok) {
              const remoteMetrics = await resp.json();
              setMetrics(
                remoteMetrics || {
                  timeSeriesData: [],
                  performanceData: {},
                  errorData: [],
                  usageData: [],
                  timestamp: Date.now(),
                }
              );
              setIsLoading(false);
              return;
            }
          }
        } catch {}
        console.error('Error al cargar mtricas:', err);
        setError('No se pudieron cargar las mtricas.');
        setMetrics({
          timeSeriesData: [],
          performanceData: {},
          errorData: [],
          usageData: [],
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Programar actualizacin de mtricas cada minuto
    const intervalId = setInterval(fetchMetrics, 60000);
    return () => clearInterval(intervalId);
  }, [selectedTimeframe]);

  // Cargar lista de errores y agregados del backend admin
  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT || '/api/admin/metrics';
        const [errsRes, aggRes] = await Promise.all([
          apiGet(
            `${endpoint}/errors?timeframe=${selectedTimeframe}&limit=1000`,
            buildAdminApiOptions()
          ),
          apiGet(
            `${endpoint}/aggregate?timeframe=${selectedTimeframe}`,
            buildAdminApiOptions()
          ),
        ]);
        if (errsRes?.ok) {
          const data = await errsRes.json();
          setErrorList(Array.isArray(data.items) ?data.items : []);
        } else {
          setErrorList([]);
        }
        if (aggRes?.ok) {
          const data = await aggRes.json();
          setAggregate({ counters: data.counters || {}, timings: data.timings || {}, eventsTotal: data.eventsTotal || 0 });
        } else {
          setAggregate({ counters: {}, timings: {}, eventsTotal: 0 });
        }
      } catch {
        setErrorList([]);
        setAggregate({ counters: {}, timings: {}, eventsTotal: 0 });
      }
    };
    load();
  }, [selectedTimeframe]);

  // Load web vitals from admin API
  useEffect(() => {
    const loadWebVitals = async () => {
      try {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT || '/api/admin/metrics';
        const res = await apiGet(
          `${endpoint}/web-vitals?timeframe=${selectedTimeframe}&limit=200`,
          buildAdminApiOptions()
        );
        if (res?.ok) {
          const data = await res.json();
          setWebVitals(Array.isArray(data.items) ?data.items : []);
        } else {
          setWebVitals([]);
        }
      } catch {
        setWebVitals([]);
      }
    };
    loadWebVitals();
  }, [selectedTimeframe]);

  // Eliminado: generacin de datos mock

  // Procesar los datos de rendimiento para el grfico de barras
  const processedPerformanceData = useMemo(() => {
    if (!metrics || !metrics.performanceData) return [];

    return Object.entries(metrics.performanceData).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      value: value,
    }));
  }, [metrics]);

  // Fallbacks para agregados si backend no devuelve datos
  const displayCounters = useMemo(() => {
    const hasAgg = aggregate && aggregate.counters && Object.keys(aggregate.counters).length > 0;
    if (hasAgg) return aggregate.counters;
    return (metrics && metrics.counters) ?metrics.counters : {};
  }, [aggregate, metrics]);

  const displayTimings = useMemo(() => {
    const hasAgg = aggregate && aggregate.timings && Object.keys(aggregate.timings).length > 0;
    if (hasAgg) return aggregate.timings;
    return (metrics && metrics.timings) ?metrics.timings : {};
  }, [aggregate, metrics]);

  // Punto Ms reciente de la serie temporal (seguro)
  const lastPoint = useMemo(() => {
    try {
      const ts = metrics?.timeSeriesData;
      if (Array.isArray(ts) && ts.length > 0) return ts[ts.length - 1];
    } catch {}
    return null;
  }, [metrics]);

  const errorTypes = useMemo(() => {
    const set = new Set(errorList.map((e) => e.type || 'error'));
    return Array.from(set);
  }, [errorList]);

  const filteredErrors = useMemo(() => {
    const base = errorList.length > 0 ?errorList : (metrics?.errors || []);
    return base.filter((e) => {
      if (errorFilterSource !== 'all' && (e.source || 'unknown') !== errorFilterSource) return false;
      if (errorFilterType !== 'all' && (e.type || 'error') !== errorFilterType) return false;
      if (errorFilterText) {
        const t = errorFilterText.toLowerCase();
        const hay = `${e.message || ''} ${e.type || ''}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [errorList, errorFilterSource, errorFilterType, errorFilterText]);

  // Si est cargando, mostrar indicador
  if (isLoading) {
    return (
      <>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>

      {/* Agregados y lista de errores */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Contadores agregados</h3>
          <div className="overflow-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Metrica</th>
                  <th className="text-right py-2 px-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(displayCounters).map(([k, v]) => (
                  <tr key={k} className="border-b">
                    <td className="py-2 px-2">{k}</td>
                    <td className="py-2 px-2 text-right">{v}</td>
                  </tr>
                ))}
                {Object.keys(displayCounters).length === 0 && (
                  <tr><td className="py-2 px-2" colSpan={2}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Tiempos agregados</h3>
          <div className="overflow-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Operacion</th>
                  <th className="text-right py-2 px-2">Promedio (ms)</th>
                  <th className="text-right py-2 px-2">p95 (ms)</th>
                  <th className="text-right py-2 px-2">p99 (ms)</th>
                  <th className="text-right py-2 px-2">Min (ms)</th>
                  <th className="text-right py-2 px-2">Max (ms)</th>
                  <th className="text-right py-2 px-2">Muestras</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(displayTimings).map(([k, t]) => (
                  <tr key={k} className="border-b">
                    <td className="py-2 px-2">{k}</td>
                    <td className="py-2 px-2 text-right">{t.count ?Math.round(t.total / t.count) : 0}</td>
                    <td className="py-2 px-2 text-right">{Math.round((t.p95 || 0))}</td>
                    <td className="py-2 px-2 text-right">{Math.round((t.p99 || 0))}</td>
                    <td className="py-2 px-2 text-right">{Math.round(t.min || 0)}</td>
                    <td className="py-2 px-2 text-right">{Math.round(t.max || 0)}</td>
                    <td className="py-2 px-2 text-right">{t.count || 0}</td>
                  </tr>
                ))}
                {Object.keys(displayTimings).length === 0 && (
                  <tr><td className="py-2 px-2" colSpan={5}>Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Errores del sistema</h3>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar..."
            className="border rounded px-3 py-2"
            value={errorFilterText}
            onChange={(e) => setErrorFilterText(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={errorFilterSource}
            onChange={(e) => setErrorFilterSource(e.target.value)}
          >
            <option value="all">Todas las fuentes</option>
            <option value="server">Servidor</option>
            <option value="ingest">Ingesta</option>
          </select>
          <select
            className="border rounded px-3 py-2"
            value={errorFilterType}
            onChange={(e) => setErrorFilterType(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            {errorTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{filteredErrors.length} de {(errorList.length || (metrics?.errors?.length || 0))}</span>
        </div>
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Top rutas backend (HTTP)</h3>
        <HttpRoutesTable />
      </div>
        <div className="overflow-auto max-h-96">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Fecha</th>
                <th className="text-left py-2 px-2">Fuente</th>
                <th className="text-left py-2 px-2">Tipo</th>
                <th className="text-left py-2 px-2">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {filteredErrors.map((e, i) => (
                <tr key={i} className="border-b align-top">
                  <td className="py-2 px-2 whitespace-nowrap">{new Date(e.timestamp || Date.now()).toLocaleString()}</td>
                  <td className="py-2 px-2">{e.source || 'unknown'}</td>
                  <td className="py-2 px-2">{e.type || 'error'}</td>
                  <td className="py-2 px-2">{e.message || ''}</td>
                </tr>
              ))}
              {filteredErrors.length === 0 && (
                <tr><td className="py-2 px-2" colSpan={4}>Sin errores en el rango seleccionado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Web Vitals recientes</h3>
        <div className="overflow-auto max-h-80">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Fecha</th>
                <th className="text-left py-2 px-2">Nombre</th>
                <th className="text-right py-2 px-2">Valor</th>
                <th className="text-left py-2 px-2">Label</th>
                <th className="text-right py-2 px-2">Delta</th>
                <th className="text-left py-2 px-2">Nav</th>
              </tr>
            </thead>
            <tbody>
              {webVitals.map((v, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-2 whitespace-nowrap">{new Date(v.ts || Date.now()).toLocaleString()}</td>
                  <td className="py-2 px-2">{v.name}</td>
                  <td className="py-2 px-2 text-right">{Math.round(v.value || 0)}</td>
                  <td className="py-2 px-2">{v.label || ''}</td>
                  <td className="py-2 px-2 text-right">{Math.round(v.delta || 0)}</td>
                  <td className="py-2 px-2">{v.navigationType || ''}</td>
                </tr>
              ))}
              {webVitals.length === 0 && (
                <tr><td className="py-2 px-2" colSpan={6}>Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Mtricas</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTimeframe('day')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'day'
                ?'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Da
          </button>
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'week'
                ?'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setSelectedTimeframe('month')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'month'
                ?'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grfico de actividad de email */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Actividad de Email</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics?.timeSeriesData || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="emailSent"
                  name="Enviados"
                  stroke={colors.email}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="emailReceived"
                  name="Recibidos"
                  stroke={colors.notification}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grfico de rendimiento */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Tiempo de Respuesta (ms)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Tiempo (ms)">
                  {processedPerformanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name.includes('Email')
                          ?colors.email
                          : entry.name.includes('Search')
                            ?colors.search
                            : entry.name.includes('Notification')
                              ?colors.notification
                              : colors.eventDetection
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Errores */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Errores por Componente</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.errorData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {(metrics?.errorData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.error} opacity={(index + 5) / 10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uso del sistema */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Uso del Sistema</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.usageData || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad">
                  {(metrics?.usageData || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name.includes('Email enviados')
                          ?colors.email
                          : entry.name.includes('Email recibidos')
                            ?colors.notification
                            : entry.name.includes('Búsquedas')
                              ?colors.search
                              : colors.eventDetection
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          Estadísticas de Uso del Sistema de Emails
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjetas de estadsticas */}
          <StatCard
            title="Emails enviados hoy"
            value={lastPoint?.emailSent || 0}
            trend={10}
            icon="x"
          />
          <StatCard
            title="Emails recibidos hoy"
            value={lastPoint?.emailReceived || 0}
            trend={15}
            icon="x"
          />
          <StatCard
            title="Búsquedas realizadas"
            value={lastPoint?.searchCount || 0}
            trend={-5}
            icon="x"
          />
          <StatCard
            title="Eventos detectados"
            value={lastPoint?.eventsDetected || 0}
            trend={20}
            icon="x&"
          />
        </div>
      </div>

      {/* altima actualizacin */}
      <div className="mt-6 text-right text-sm text-gray-500">
        altima actualizacin:{' '}
        {metrics?.timestamp ?new Date(metrics.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}

/**
 * Tarjeta para mostrar estadsticas individuales
 */
function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${trend >= 0 ?'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ?' ' : ' '} {Math.abs(trend)}%
        </span>
      </div>
      <h4 className="mt-2 text-gray-500 text-sm">{title}</h4>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

export default MetricsDashboard;


function HttpRoutesTable() {
  const [data, setData] = React.useState({ routes: [], totals: { totalRequests: 0, totalErrors: 0, errorRate: 0 } });
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const endpoint = import.meta.env.VITE_BACKEND_BASE_URL || '';
        const url = (endpoint ?`${endpoint}` : '') + '/api/admin/metrics/http?limit=50';
        const res = await apiGet(url, buildAdminApiOptions({ silent: true }));
        if (!mounted) return;
        if (res?.ok) {
          const json = await res.json();
          setData(json);
          setErr('');
        } else {
          setErr('No disponible');
        }
      } catch (e) {
        if (mounted) setErr('No disponible');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Cargando rutas...</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  return (
    <div className="overflow-auto max-h-96">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">Método</th>
            <th className="text-left py-2 px-2">Ruta</th>
            <th className="text-right py-2 px-2">Total</th>
            <th className="text-right py-2 px-2">Errores</th>
            <th className="text-right py-2 px-2">Error rate</th>
            <th className="text-right py-2 px-2">Avg (s)</th>
            <th className="text-right py-2 px-2">p95 (s)</th>
            <th className="text-right py-2 px-2">p99 (s)</th>
          </tr>
        </thead>
        <tbody>
          {data.routes.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-2">{r.method}</td>
              <td className="py-2 px-2">{r.route}</td>
              <td className="py-2 px-2 text-right">{r.total}</td>
              <td className="py-2 px-2 text-right">{r.errors}</td>
              <td className="py-2 px-2 text-right">{(r.errorRate * 100).toFixed(1)}%</td>
              <td className="py-2 px-2 text-right">{(r.avg).toFixed(3)}</td>
              <td className="py-2 px-2 text-right">{(r.p95).toFixed(3)}</td>
              <td className="py-2 px-2 text-right">{(r.p99).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function UsersWithErrors() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT || '/api/admin/metrics';
        const res = await apiGet(
          `${endpoint}/errors/by-user?timeframe=day`,
          buildAdminApiOptions({ silent: true })
        );
        if (!mounted) return;
        if (res?.ok) {
          const json = await res.json();
          setData(json.items || []);
          setErr('');
        } else {
          setErr('No disponible');
        }
      } catch (e) {
        if (mounted) setErr('No disponible');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Cargando usuarios...</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  return (
    <div className="overflow-auto max-h-80">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">Usuario</th>
            <th className="text-right py-2 px-2">Errores</th>
            <th className="text-left py-2 px-2">Fuentes</th>
            <th className="text-left py-2 px-2">Último</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2 px-2">{r.user?.email || r.user?.uid || 'unknown'}</td>
              <td className="py-2 px-2 text-right">{r.count}</td>
              <td className="py-2 px-2">{(r.sources || []).join(', ')}</td>
              <td className="py-2 px-2">{new Date(r.lastTimestamp || Date.now()).toLocaleString()}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td className="py-2 px-2" colSpan={4}>Sin usuarios con errores recientes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
