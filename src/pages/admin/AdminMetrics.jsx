import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const data = await getMetricsData();
      setSeries(data.series || []);
      setFunnel(data.funnel);
      setIaCosts(data.iaCosts || []);
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
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold">Usuarios activos</h2>
              <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                Distribución diaria.
              </p>
              <div className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-soft text-xs text-[var(--color-text-soft,#6b7280)]">
                {series.length ? 'Visualización disponible con datos reales' : 'Sin datos suficientes para generar la visualización'}
              </div>
            </article>
            <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
              <h2 className="text-sm font-semibold">Ingresos estimados</h2>
              <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                Comparativa con el periodo anterior.
              </p>
              <div className="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-soft text-xs text-[var(--color-text-soft,#6b7280)]">
                {iaCosts.length ? 'Visualización disponible con datos reales' : 'Sin datos suficientes para generar la visualización'}
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
                <>
                  <div className="rounded-lg border border-soft px-3 py-4 text-sm">
                    <p className="font-medium">Visitantes</p>
                    <p className="text-2xl font-semibold">4200</p>
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">100%</p>
                  </div>
                  <div className="rounded-lg border border-soft px-3 py-4 text-sm">
                    <p className="font-medium">Registrados</p>
                    <p className="text-2xl font-semibold">1680</p>
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">40%</p>
                  </div>
                  <div className="rounded-lg border border-soft px-3 py-4 text-sm">
                    <p className="font-medium">Bodas activas</p>
                    <p className="text-2xl font-semibold">705</p>
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">16.7%</p>
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminMetrics;
