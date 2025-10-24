import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Avatar,
  Button,
  CircularProgress,
} from '@mui/material';
import { Calendar, Coins, Download, Bell, Shield } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { get as apiGet } from '../../services/apiClient';
import { resolveAdminAlert } from '../../services/adminDataService';
import { getAdminFetchOptions } from '../../services/adminSession';
import { decodeMojibakeDeep } from '../../utils/mojibake';

const KPI_CONFIG = {
  'active-weddings': { icon: <Calendar size={24} />, color: 'rgb(37, 99, 235)' },
  'revenue-30d': { icon: <Coins size={24} />, color: 'rgb(234, 88, 12)' },
  'downloads-30d': { icon: <Download size={24} />, color: 'rgb(16, 185, 129)' },
  'open-alerts': { icon: <Bell size={24} />, color: 'rgb(244, 63, 94)' },
};

const STATUS_COLOR = {
  operational: 'success',
  degraded: 'warning',
  down: 'error',
};

const SEVERITY_COLOR = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const formatGigabytes = (value) =>
  Number.isFinite(value) ? `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })} GB` : '0 GB';

const formatPercent = (value, fractionDigits = 1) =>
  Number.isFinite(value) ? `${value.toFixed(fractionDigits)}%` : '0%';

const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString('es-ES') : '0';

const formatSourceLabel = (value) => {
  if (!value) return 'sin datos';
  const normalized = String(value).toLowerCase();
  if (normalized === 'fallback') return 'estimado';
  if (normalized === 'firestore') return 'Firestore';
  if (normalized === 'realtime') return 'tiempo real';
  return value;
};

const formatSinceDate = (value) => {
  if (!value) return 'sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sin datos';
  return date.toLocaleDateString('es-ES');
};

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [newTasks, setNewTasks] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [metricsSummary, setMetricsSummary] = useState({
    series: [],
    funnel: [],
    iaCosts: [],
    communications: [],
    supportMetrics: null,
    storage: {
      totalGigabytes: 0,
      premiumAverageGigabytes: 0,
      premiumCount: 0,
      source: 'fallback',
    },
    downloads: {
      total: 0,
      last30d: 0,
      source: 'fallback',
    },
    traffic: {
      totalVisits: 0,
      newVisits: 0,
      since: null,
      source: 'fallback',
    },
    userGrowth: {
      newUsers: 0,
      newPremiumUsers: 0,
      newPremiumShare: 0,
      totalUsers: 0,
      since: null,
      source: 'fallback',
    },
    meta: null,
    error: null,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [resolvingAlertId, setResolvingAlertId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadOverview = async () => {
      setLoadingOverview(true);
      try {
        const res = await apiGet(
          '/api/admin/dashboard/overview',
          getAdminFetchOptions({ auth: false, silent: true }),
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const normalized = decodeMojibakeDeep(data);
        setOverview(normalized);
        setServices(Array.isArray(normalized?.services) ? normalized.services : []);
        setAlerts(Array.isArray(normalized?.alerts) ? normalized.alerts : []);
        setNewTasks(Array.isArray(normalized?.newTasks) ? normalized.newTasks : []);
        setOverviewError('');
      } catch (error) {
        if (cancelled) return;
        setOverview(null);
        setServices([]);
        setAlerts([]);
        setNewTasks([]);
        setOverviewError('No se pudo cargar el resumen administrativo.');
        console.warn('[AdminDashboard] overview load error:', error);
      } finally {
        if (!cancelled) setLoadingOverview(false);
      }
    };

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const res = await apiGet(
          '/api/admin/dashboard/metrics',
          getAdminFetchOptions({ auth: false, silent: true }),
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setMetricsSummary({ ...data, error: null });
          setMetricsError('');
        }
      } catch (error) {
        console.warn('[AdminDashboard] metrics load error:', error);
        if (!cancelled) {
          setMetricsSummary((prev) => ({ ...prev, error: 'No disponible' }));
          setMetricsError('No se pudieron obtener las métricas en tiempo real.');
        }
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    };
    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpiCards = useMemo(() => {
    if (!overview?.kpis?.length) {
      return [
        { id: 'active-weddings', label: 'Bodas activas', value: '—', testId: 'admin-kpi-active-weddings' },
        { id: 'revenue-30d', label: 'Facturación (30 días)', value: '€ 0', testId: 'admin-kpi-revenue-30d' },
        { id: 'downloads-30d', label: 'Descargas app (30 días)', value: '—', testId: 'admin-kpi-downloads-30d' },
        { id: 'open-alerts', label: 'Alertas activas', value: '—', testId: 'admin-kpi-open-alerts' },
      ];
    }
    return overview.kpis.map((kpi) => ({
      ...kpi,
      value:
        typeof kpi.value === 'number'
          ? kpi.value.toLocaleString('es-ES')
          : kpi.value ?? '—',
    }));
  }, [overview?.kpis]);

  const lastSeriesPoint = useMemo(() => {
    const data = metricsSummary?.series;
    if (Array.isArray(data) && data.length) {
      return data[data.length - 1];
    }
    return null;
  }, [metricsSummary?.series]);

  const totalIaCost = useMemo(() => {
    const arr = metricsSummary?.iaCosts;
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((acc, item) => acc + (Number(item?.cost) || 0), 0);
  }, [metricsSummary?.iaCosts]);

  const communicationsTotal = useMemo(() => {
    const arr = metricsSummary?.communications;
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((acc, item) => acc + (Number(item?.total) || 0), 0);
  }, [metricsSummary?.communications]);

  const openAlertsCount = useMemo(
    () => alerts.filter((alert) => !alert.resolved).length,
    [alerts],
  );

  const handleResolveAlert = async (alertId) => {
    if (resolvingAlertId) return;
    setResolvingAlertId(alertId);
    try {
      await resolveAdminAlert(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, resolved: true, timestamp: alert.timestamp } : alert,
        ),
      );
    } catch (error) {
      console.error('[AdminDashboard] resolve alert error:', error);
      window.alert('No se pudo marcar la alerta como resuelta.');
    } finally {
      setResolvingAlertId(null);
    }
  };

  const supportMetrics = metricsSummary?.supportMetrics;
  const storageMetrics = metricsSummary?.storage || {
    totalGigabytes: 0,
    premiumAverageGigabytes: 0,
    premiumCount: 0,
    source: 'fallback',
  };
  const downloadMetrics = metricsSummary?.downloads || {
    total: 0,
    last30d: 0,
    source: 'fallback',
  };
  const trafficMetrics = metricsSummary?.traffic || {
    totalVisits: 0,
    newVisits: 0,
    since: null,
    source: 'fallback',
  };
  const userGrowthMetrics = metricsSummary?.userGrowth || {
    newUsers: 0,
    newPremiumUsers: 0,
    newPremiumShare: 0,
    totalUsers: 0,
    since: null,
    source: 'fallback',
  };
  const visitsToUsersRatio =
    userGrowthMetrics.newUsers > 0
      ? (trafficMetrics.newVisits / userGrowthMetrics.newUsers) * 100
      : 0;
  const premiumSharePercent = userGrowthMetrics.newPremiumShare
    ? userGrowthMetrics.newPremiumShare * 100
    : userGrowthMetrics.newUsers > 0
    ? (userGrowthMetrics.newPremiumUsers / userGrowthMetrics.newUsers) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <Box className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Typography variant="h4" className="font-medium">
          Panel de Administración
        </Typography>
        <Chip
          avatar={
            <Avatar alt={currentUser?.displayName || 'Admin'}>
              {(currentUser?.displayName?.[0] || 'A').toUpperCase()}
            </Avatar>
          }
          label={`Hola, ${currentUser?.displayName || 'Admin'}`}
          variant="outlined"
          color="primary"
        />
      </Box>

      {loadingOverview ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <CircularProgress size={32} />
          </CardContent>
        </Card>
      ) : (
        <>
          {overviewError && (
            <Card>
              <CardContent>
                <Typography color="error">{overviewError}</Typography>
              </CardContent>
            </Card>
          )}
          <Grid container spacing={3}>
            {kpiCards.map((card) => {
              const config = KPI_CONFIG[card.id] || { icon: <Shield size={24} />, color: 'rgb(109, 40, 217)' };
              const value =
                typeof card.value === 'number'
                  ? card.value.toLocaleString('es-ES')
                  : String(card.value);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.id}>
                  <Card className="h-full" data-testid={card.testId || `admin-kpi-${card.id}`}>
                    <CardContent>
                      <Box className="flex justify-between items-center">
                        <Box>
                          <Typography variant="h6" color="textSecondary" gutterBottom>
                            {card.label}
                          </Typography>
                          <Typography variant="h4" component="div" className="font-semibold">
                            {value}
                          </Typography>
                          {card.trend != null && (
                            <Typography variant="body2" color="textSecondary">
                              {card.trend >= 0 ? '↗' : '↘'} {Math.abs(card.trend)}%
                            </Typography>
                          )}
                        </Box>
                        <Avatar sx={{ bgcolor: config.color, width: 56, height: 56 }}>{config.icon}</Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="h-full">
            <CardHeader title="Estado de integraciones" />
            <CardContent>
              {services.length === 0 ? (
                <Typography color="textSecondary">Sin datos de integraciones.</Typography>
              ) : (
                <Box className="space-y-2">
                  {services.map((service) => (
                    <Box
                      key={service.id}
                      className="flex items-center justify-between rounded border border-soft px-3 py-2"
                    >
                      <Box>
                        <Typography variant="subtitle2">{service.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Latencia: {service.latency || '—'} · Incidentes: {service.incidents ?? 0}
                        </Typography>
                        {service.note ? (
                          <Typography
                            variant="caption"
                            color={service.status === 'operational' ? 'textSecondary' : 'error.main'}
                          >
                            {service.note}
                          </Typography>
                        ) : null}
                      </Box>
                      <Chip
                        size="small"
                        label={service.status === 'operational' ? 'Operativo' : service.status === 'down' ? 'Caído' : 'Degradado'}
                        color={STATUS_COLOR[service.status] || 'default'}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="h-full">
            <CardHeader
              title="Alertas"
              action={
                <Chip
                  icon={<Bell size={14} />}
                  label={`${openAlertsCount} activas`}
                  color={openAlertsCount > 0 ? 'warning' : 'success'}
                  variant="outlined"
                />
              }
            />
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <Typography color="textSecondary">Sin alertas registradas.</Typography>
              ) : (
                alerts.map((alert) => (
                  <Box
                    key={alert.id}
                    className="rounded border border-soft px-3 py-2 flex flex-col gap-1"
                  >
                    <Box className="flex items-center justify-between">
                      <Typography variant="subtitle2">{alert.module}</Typography>
                      <Chip
                        size="small"
                        label={alert.severity?.toUpperCase() || 'MEDIUM'}
                        color={SEVERITY_COLOR[alert.severity] || 'default'}
                      />
                    </Box>
                    <Typography variant="body2">{alert.message}</Typography>
                    <Box className="flex items-center justify-between text-xs text-gray-500">
                      <span>{alert.timestamp || '—'}</span>
                      {!alert.resolved ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolvingAlertId === alert.id}
                        >
                          {resolvingAlertId === alert.id ? 'Resolviendo…' : 'Marcar resuelta'}
                        </Button>
                      ) : (
                        <Chip size="small" label="Resuelta" color="success" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card data-testid="admin-new-tasks-card">
        <CardHeader
          title="Tareas nuevas de usuarios"
          subheader="Acciones creadas manualmente en los últimos 14 días"
        />
        <CardContent>
          {Array.isArray(newTasks) && newTasks.length > 0 ? (
            <Box className="space-y-3">
              {newTasks.map((task) => (
                <Box
                  key={task.key}
                  className="rounded border border-soft px-3 py-2"
                >
                  <Box className="flex items-start justify-between gap-4">
                    <Box>
                      <Typography variant="subtitle1" className="font-semibold">
                        {task.label}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {task.totalWeddings} boda(s) · {task.totalOccurrences} aparición(es)
                      </Typography>
                    </Box>
                    {task.lastCreatedAt && (
                      <Typography variant="caption" color="textSecondary">
                        Última: {task.lastCreatedAt}
                      </Typography>
                    )}
                  </Box>
                  {Array.isArray(task.sampleTitles) && task.sampleTitles.length > 0 && (
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                      Ejemplos: {task.sampleTitles.join(', ')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">
              Sin tareas nuevas registradas recientemente.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Salud del sistema" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="bg-gray-50 rounded p-4">
                <Typography variant="overline" display="block" color="textSecondary">
                  Nuevos usuarios (último día)
                </Typography>
                <Typography variant="h5">{lastSeriesPoint?.newUsers ?? 0}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="bg-gray-50 rounded p-4">
                <Typography variant="overline" display="block" color="textSecondary">
                  Bodas creadas (último día)
                </Typography>
                <Typography variant="h5">{lastSeriesPoint?.newWeddings ?? 0}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="bg-gray-50 rounded p-4">
                <Typography variant="overline" display="block" color="textSecondary">
                  Coste IA estimado (mes)
                </Typography>
                <Typography variant="h5">
                  {totalIaCost ? totalIaCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="bg-gray-50 rounded p-4">
                <Typography variant="overline" display="block" color="textSecondary">
                  Alertas activas
                </Typography>
                <Typography variant="h5">{openAlertsCount}</Typography>
              </Box>
            </Grid>
          </Grid>
          <Box className="mt-3 text-right text-sm text-gray-500">
            {loadingMetrics ? (
              <span>Cargando métricas…</span>
            ) : metricsError ? (
              <span>Error de métricas: {metricsError}</span>
            ) : metricsSummary?.meta?.end ? (
              <span>Actualizado: {new Date(metricsSummary.meta.end).toLocaleString()}</span>
            ) : (
              <span>Actualización pendiente</span>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <Card className="h-full" data-testid="admin-metrics-storage-card">
            <CardHeader title="Uso de almacenamiento" subheader={`Fuente: ${formatSourceLabel(storageMetrics.source)}`} />
            <CardContent>
              <Box className="grid grid-cols-2 gap-3">
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Total Firebase
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-storage-total">
                    {formatGigabytes(storageMetrics.totalGigabytes)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Promedio premium
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-storage-premium-avg">
                    {formatGigabytes(storageMetrics.premiumAverageGigabytes)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Bodas premium
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-storage-premium-count">
                    {formatInteger(storageMetrics.premiumCount)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <Card className="h-full" data-testid="admin-metrics-downloads-card">
            <CardHeader title="Descargas" subheader={`Fuente: ${formatSourceLabel(downloadMetrics.source)}`} />
            <CardContent>
              <Box className="space-y-3">
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Totales acumuladas
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-downloads-total">
                    {formatInteger(downloadMetrics.total)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Ultimos 30 dias
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-downloads-30d">
                    {formatInteger(downloadMetrics.last30d)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Actualizado con eventos de descarga
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <Card className="h-full" data-testid="admin-metrics-traffic-card">
            <CardHeader title="Trafico web" subheader={`Fuente: ${formatSourceLabel(trafficMetrics.source)}`} />
            <CardContent>
              <Box className="space-y-3">
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Visitas totales
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-traffic-total">
                    {formatInteger(trafficMetrics.totalVisits)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Visitas nuevas 30 dias
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-traffic-new">
                    {formatInteger(trafficMetrics.newVisits)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Visitas vs nuevos usuarios
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-traffic-ratio">
                    {formatPercent(visitsToUsersRatio)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" data-testid="admin-metrics-traffic-since">
                  Periodo desde {formatSinceDate(trafficMetrics.since)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <Card className="h-full" data-testid="admin-metrics-usergrowth-card">
            <CardHeader title="Crecimiento usuarios" subheader={`Fuente: ${formatSourceLabel(userGrowthMetrics.source)}`} />
            <CardContent>
              <Box className="grid grid-cols-2 gap-3">
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Nuevos 30 dias
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-usergrowth-new">
                    {formatInteger(userGrowthMetrics.newUsers)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Premium 30 dias
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-usergrowth-premium">
                    {formatInteger(userGrowthMetrics.newPremiumUsers)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Proporcion premium
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-usergrowth-share">
                    {formatPercent(premiumSharePercent)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" display="block" color="textSecondary">
                    Usuarios totales
                  </Typography>
                  <Typography variant="h6" data-testid="admin-metrics-usergrowth-total">
                    {formatInteger(userGrowthMetrics.totalUsers)}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                className="block mt-2"
                data-testid="admin-metrics-usergrowth-since"
              >
                Periodo desde {formatSinceDate(userGrowthMetrics.since)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="h-full">
            <CardHeader title="Comunicaciones recientes" />
            <CardContent>
              {metricsSummary?.communications?.length ? (
                <Box className="space-y-2">
                  {metricsSummary.communications.map((item, idx) => (
                    <Box
                      key={`${item.channel}-${idx}`}
                      className="flex items-center justify-between rounded border border-soft px-3 py-2"
                    >
                      <Typography variant="subtitle2">{item.channel}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.total ?? 0} en los últimos 7 días
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="caption" color="textSecondary">
                    Total: {communicationsTotal}
                  </Typography>
                </Box>
              ) : (
                <Typography color="textSecondary">Sin comunicaciones registradas.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="h-full">
            <CardHeader title="Soporte" />
            <CardContent>
              {supportMetrics ? (
                <Box className="grid grid-cols-2 gap-3">
                  <Box>
                    <Typography variant="overline" display="block" color="textSecondary">
                      Tickets abiertos
                    </Typography>
                    <Typography variant="h6">{supportMetrics.openTickets ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" display="block" color="textSecondary">
                      SLA incumplidos
                    </Typography>
                    <Typography variant="h6">{supportMetrics.slaBreaches ?? 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" display="block" color="textSecondary">
                      Tiempo medio respuesta (min)
                    </Typography>
                    <Typography variant="h6">{supportMetrics.avgResponseMinutes ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" display="block" color="textSecondary">
                      NPS
                    </Typography>
                    <Typography variant="h6">{supportMetrics.nps ?? '—'}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="textSecondary">Sin datos de soporte registrados.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AdminDashboard;
