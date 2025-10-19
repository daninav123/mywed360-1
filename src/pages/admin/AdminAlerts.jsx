import React, { useEffect, useState } from 'react';

import { getAlertsData, resolveAdminAlert } from '../../services/adminDataService';

const severityLabels = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      const data = await getAlertsData();
      setAlerts(data || []);
      setSelected((data && data[0]) || null);
      setLoading(false);
    };
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando alertas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Alertas</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Revisión detallada de incidentes críticos registrados.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-soft bg-surface shadow-sm">
          <ul className="divide-y divide-soft">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={selected?.id === alert.id ? 'px-4 py-3 text-sm bg-[var(--color-bg-soft,#f3f4f6)]' : 'px-4 py-3 text-sm'}
                data-testid="admin-alert-item"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1" onClick={() => setSelected(alert)}>
                    <p className="font-medium">{alert.module}</p>
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{severityLabels[alert.severity]} · {alert.timestamp}</p>
                  </div>
                  {!alert.resolved && (
                    <button
                      type="button"
                      data-testid="admin-alert-resolve-list"
                      onClick={() => { setSelected(alert); setResolveNotes(''); setShowResolve(true); }}
                      className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                    >
                      Marcar resuelta
                    </button>
                  )}
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
                No hay alertas registradas.
              </li>
            )}
          </ul>
        </aside>
        <div className="rounded-xl border border-soft bg-surface shadow-sm p-6" data-testid="admin-alert-detail">
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selected.module}</h2>
                <span className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
                  {severityLabels[selected.severity]}
                </span>
              </div>
              <p>{selected.message}</p>
              <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{selected.timestamp}</p>
              {!selected.resolved && (
                <div className="pt-2">
                  <button
                    type="button"
                    data-testid="admin-alert-resolve"
                    className="rounded-md border border-soft px-3 py-1 text-xs font-medium text-[color:var(--color-primary,#6366f1)] hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                    onClick={() => setShowResolve(true)}
                  >
                    Marcar resuelta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Selecciona una alerta.</p>
          )}
        </div>
      </div>
      {showResolve && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" data-testid="admin-alert-resolve-modal">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Resolver alerta</h3>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">{selected.message}</p>
            </div>
            <textarea
              data-testid="admin-alert-resolve-notes"
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
              rows={4}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Describe la acción tomada"
            />
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={() => setShowResolve(false)} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="admin-alert-resolve-confirm"
                onClick={async () => {
                  try {
                    await resolveAdminAlert(selected.id, resolveNotes.trim());
                    setAlerts((prev) => prev.map((a) => (a.id === selected.id ? { ...a, resolved: true } : a)));
                    setSelected((prev) => (prev ? { ...prev, resolved: true } : prev));
                  } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('[AdminAlerts] resolve failed:', e);
                  } finally {
                    setShowResolve(false);
                  }
                }}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;