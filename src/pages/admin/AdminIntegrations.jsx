import React, { useEffect, useState } from 'react';

import { getIntegrationsData, retryIntegration } from '../../services/adminDataService';
import { useTranslations } from '../../hooks/useTranslations';

const statusInfo = {
  const { t } = useTranslations();

  operational: { label: 'Operativo', className: 'text-green-600' },
  degraded: { label: 'Degradado', className: 'text-amber-600' },
  down: { label: {t('common.caido')}, className: 'text-red-600' },
};

const AdminIntegrations = () => {
  const [data, setData] = useState({ services: [], incidents: [] });
  const [loading, setLoading] = useState(true);
  const [showRetry, setShowRetry] = useState(''); // guarda id del servicio a reintentar

  useEffect(() => {
    const loadIntegrations = async () => {
      setLoading(true);
      const response = await getIntegrationsData();
      setData(response || { services: [], incidents: [] });
      setLoading(false);
    };
    loadIntegrations();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando integraciones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Integraciones y salud</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
          Estado actual de servicios externos y registro de incidentes.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.services.map((service) => {
          const info = statusInfo[service.status] || statusInfo.operational;
          return (
            <article
              key={service.id || service.name}
              data-testid={'integration-card-' + (service.id || service.name)}
              className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm"
            >
              <header className="flex items-center justify-between text-sm">
                <span className="font-medium">{service.name}</span>
                <span className={info.className}>{info.label}</span>
              </header>
              <dl className="mt-4 text-xs text-[var(--color-text-soft,#6b7280)] space-y-1">
                <div className="flex justify-between">
                  <dt>Latencia media</dt>
                  <dd>{service.latency || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Incidentes 30d</dt>
                  <dd>{service.incidents ?? 0}</dd>
                </div>
              </dl>
              <button
                type="button"
                data-testid="integration-retry-button"
                onClick={() => setShowRetry(service.id || service.name)}
                className="mt-4 text-xs font-medium text-[color:var(--color-primary,#6366f1)]"
              >
                Reintentar conexión
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h2 className="text-sm font-semibold">Incidentes recientes</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-soft text-sm" data-testid="integration-incidents-table">
            <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
              <tr>
                <th className="px-4 py-3 text-left">Servicio</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Duración</th>
                <th className="px-4 py-3 text-left">Impacto</th>
                <th className="px-4 py-3 text-left">Acciones</th>
                <th className="px-4 py-3 text-left">Resuelto por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft">
              {data.incidents.map((incident) => (
                <tr key={incident.id}>
                  <td className="px-4 py-3">{incident.service}</td>
                  <td className="px-4 py-3">{incident.startedAt}</td>
                  <td className="px-4 py-3">{incident.duration}</td>
                  <td className="px-4 py-3">{incident.impact}</td>
                  <td className="px-4 py-3">{incident.action}</td>
                  <td className="px-4 py-3">{incident.resolvedBy}</td>
                </tr>
              ))}
              {data.incidents.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={6}>
                    Sin incidentes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showRetry && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="integration-retry-confirm-modal">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
              ¿Deseas reintentar la conexión del servicio seleccionado?
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={() => setShowRetry('')} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="integration-retry-confirm"
                onClick={async () => {
                  try {
                    const updated = await retryIntegration(showRetry);
                    if (updated) {
                      setData((prev) => ({
                        ...prev,
                        services: prev.services.map((s) =>
                          (s.id === updated.id || s.name === updated.name) ? { ...s, ...updated } : s
                        ),
                      }));
                    }
                  } catch (e) {
                    console.warn('[AdminIntegrations] retry failed:', e);
                  } finally {
                    setShowRetry('');
                  }
                }}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIntegrations;