import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Eye, MousePointer, Mail, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Spinner from '../../components/ui/Spinner';
import useTranslations from '../../hooks/useTranslations';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function SupplierAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d'); // 7d, 30d, 90d
  const [chartType, setChartType] = useState('line'); // line, bar

  useEffect(() => {
    loadData();
  }, [id, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');

      // Cargar datos del gráfico
      const chartResponse = await fetch(
        `${API_BASE}/api/supplier-dashboard/analytics/chart?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Cargar métricas generales
      const metricsResponse = await fetch(
        `${API_BASE}/api/supplier-dashboard/analytics?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (chartResponse.ok && metricsResponse.ok) {
        const chartData = await chartResponse.json();
        const metricsData = await metricsResponse.json();

        // Formatear fechas para el gráfico
        const formattedData = chartData.data.map((day) => ({
          ...day,
          dateLabel: new Date(day.date).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
          }),
        }));

        setChartData(formattedData);
        setMetrics(metricsData.metrics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular tendencias (comparado con período anterior)
  const calculateTrend = (metric) => {
    if (!chartData.length) return 0;

    const halfPoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, halfPoint);
    const secondHalf = chartData.slice(halfPoint);

    const firstSum = firstHalf.reduce((sum, day) => sum + (day[metric] || 0), 0);
    const secondSum = secondHalf.reduce((sum, day) => sum + (day[metric] || 0), 0);

    if (firstSum === 0) return secondSum > 0 ? 100 : 0;
    return ((secondSum - firstSum) / firstSum) * 100;
  };

  const viewsTrend = calculateTrend('views');
  const clicksTrend = calculateTrend('clicks');
  const requestsTrend = calculateTrend('requests');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="flex items-center gap-2 hover:opacity-70"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={20} />
            <span>Volver al Dashboard</span>
          </button>

          {/* Selector de período */}
          <div className="flex items-center gap-2">
            <Calendar size={20} style={{ color: 'var(--color-text)' }} />
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  period === p ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: period === p ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: period === p ? 'white' : 'var(--color-text)',
                }}
              >
                {p === '7d' && '7 días'}
                {p === '30d' && '30 días'}
                {p === '90d' && '90 días'}
              </button>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
          Analíticas Avanzadas
        </h1>

        {/* Tarjetas de métricas con tendencias */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Eye size={24} style={{ color: 'var(--color-primary)' }} />
                <div
                  className={`flex items-center gap-1 text-sm ${
                    viewsTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendingUp size={16} />
                  {viewsTrend >= 0 ? '+' : ''}
                  {viewsTrend.toFixed(1)}%
                </div>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {metrics.views}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Vistas del perfil
              </div>
            </div>

            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <MousePointer size={24} style={{ color: 'var(--color-success)' }} />
                <div
                  className={`flex items-center gap-1 text-sm ${
                    clicksTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendingUp size={16} />
                  {clicksTrend >= 0 ? '+' : ''}
                  {clicksTrend.toFixed(1)}%
                </div>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {metrics.clicks}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Clics en contacto
              </div>
            </div>

            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Mail size={24} style={{ color: 'var(--color-warning)' }} />
                <div
                  className={`flex items-center gap-1 text-sm ${
                    requestsTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendingUp size={16} />
                  {requestsTrend >= 0 ? '+' : ''}
                  {requestsTrend.toFixed(1)}%
                </div>
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {metrics.requests}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Solicitudes recibidas
              </div>
            </div>

            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {metrics.conversionRate}%
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Tasa de conversión
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                (Solicitudes / Vistas)
              </div>
            </div>
          </div>
        )}

        {/* Selector de tipo de gráfico */}
        <div
          className="shadow-md rounded-lg p-6 mb-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              Evolución temporal
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  chartType === 'line' ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: chartType === 'line' ? 'var(--color-primary)' : 'transparent',
                  color: chartType === 'line' ? 'white' : 'var(--color-text)',
                }}
              >
                Líneas
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  chartType === 'bar' ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: chartType === 'bar' ? 'var(--color-primary)' : 'transparent',
                  color: chartType === 'bar' ? 'white' : 'var(--color-text)',
                }}
              >
                Barras
              </button>
            </div>
          </div>

          {/* Gráfico */}
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#6d28d9"
                  name="Vistas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#22c55e"
                  name="Clics"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#f59e0b"
                  name="Solicitudes"
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dateLabel" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="views" fill="#6d28d9" name="Vistas" />
                <Bar dataKey="clicks" fill="#22c55e" name="Clics" />
                <Bar dataKey="requests" fill="#f59e0b" name="Solicitudes" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Insights y recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="shadow-md rounded-lg p-6"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              📊 Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  Tu perfil ha recibido <strong>{metrics?.views}</strong> vistas en los últimos{' '}
                  {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: 'var(--color-success)' }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  Tasa de conversión del <strong>{metrics?.conversionRate}%</strong>
                  {metrics?.conversionRate > 5
                    ? ' - ¡Excelente! Estás por encima del promedio'
                    : ' - Considera mejorar tu descripción y fotos'}
                </p>
              </div>
            </div>
          </div>

          <div
            className="shadow-md rounded-lg p-6"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              💡 Recomendaciones
            </h3>
            <div className="space-y-3">
              {viewsTrend < 0 && (
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-2"
                    style={{ backgroundColor: 'var(--color-warning)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Tus vistas han disminuido. Actualiza tu portfolio con nuevas fotos.
                  </p>
                </div>
              )}
              {metrics?.conversionRate < 3 && (
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-2"
                    style={{ backgroundColor: 'var(--color-error)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Tu tasa de conversión es baja. Mejora tu descripción y añade más detalles de
                    precios.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  Responde rápido a las solicitudes para aumentar tus conversiones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
