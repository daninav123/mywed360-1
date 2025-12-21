import React, { useEffect, useState } from 'react';

import { getAlertsData, resolveAdminAlert } from '../../services/adminDataService';

const severityLabels = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

const alertTypeLabels = {
  fallback: '🔔 Fallback',
  system: '⚙️ Sistema',
  security: '🔒 Seguridad',
  performance: '⚡ Rendimiento',
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
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
        Cargando alertas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Alertas</h1>
        <p className="text-sm text-[color:var(--color-text-soft)]">Revisión detallada de incidentes críticos registrados.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-soft bg-surface shadow-sm">
          <ul className="divide-y divide-soft">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={selected?.id === alert.id ? 'px-4 py-3 text-sm bg-[var(--color-bg-soft)]' : 'px-4 py-3 text-sm'}
                data-testid="admin-alert-item"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelected(alert)}>
                    <div className="flex items-center gap-2">
                      {alert.type && (
                        <span className="text-xs">{alertTypeLabels[alert.type] || '📌'}</span>
                      )}
                      <p className="font-medium">{alert.service || alert.module}</p>
                    </div>
                    <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                      {severityLabels[alert.severity]} · {alert.timestamp}
                    </p>
                    {alert.count && (
                      <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5">
                        {alert.count} activaciones
                      </p>
                    )}
                  </div>
                  {!alert.resolved && (
                    <button
                      type="button"
                      data-testid="admin-alert-resolve-list"
                      onClick={() => { setSelected(alert); setResolveNotes(''); setShowResolve(true); }}
                      className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft)]"
                    >
                      Marcar resuelta
                    </button>
                  )}
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[color:var(--color-text-soft)]">
                No hay alertas registradas.
              </li>
            )}
          </ul>
        </aside>
        <div className="rounded-xl border border-soft bg-surface shadow-sm p-6" data-testid="admin-alert-detail">
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {selected.type && (
                      <span className="text-lg">{alertTypeLabels[selected.type] || '📌'}</span>
                    )}
                    <h2 className="text-lg font-semibold">{selected.service || selected.module}</h2>
                  </div>
                  {selected.module && selected.service && (
                    <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
                      Categoría: {selected.module}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors[selected.severity] || 'bg-gray-100 text-gray-800'}`}>
                  {severityLabels[selected.severity]}
                </span>
              </div>
              
              <div className="p-3 bg-[var(--color-bg-soft)] rounded-lg">
                <p className="text-sm">{selected.message}</p>
              </div>
              
              {selected.count && (
                <div className="flex items-center gap-4 text-xs text-[color:var(--color-text-soft)]">
                  <span>📊 Activaciones: <strong>{selected.count}</strong></span>
                  {selected.threshold && (
                    <span>⚠️ Umbral: {selected.threshold}/hora</span>
                  )}
                </div>
              )}
              
              <p className="text-xs text-[color:var(--color-text-soft)]">
                📅 {selected.timestamp}
              </p>
              
              {selected.actions && selected.actions.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">🔧 Acciones recomendadas:</p>
                  <ul className="space-y-1.5 text-sm">
                    {selected.actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[color:var(--color-text-soft)] mt-0.5">•</span>
                        <span className={action.startsWith('🚨') ? 'font-semibold text-red-700' : ''}>
                          {action}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!selected.resolved && (
                <div className="pt-2 border-t">
                  <button
                    type="button"
                    data-testid="admin-alert-resolve"
                    className="rounded-md border border-soft px-4 py-2 text-sm font-medium text-[color:var(--color-primary)] hover:bg-[var(--color-bg-soft)]"
                    onClick={() => setShowResolve(true)}
                  >
                    ✓ Marcar como resuelta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-soft)]">Selecciona una alerta para ver los detalles.</p>
          )}
        </div>
      </div>
      {showResolve && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" data-testid="admin-alert-resolve-modal">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Resolver alerta</h3>
              <p className="text-sm text-[color:var(--color-text-soft)]">{selected.message}</p>
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
              <button type="button" onClick={() => setShowResolve(false)} className="px-3 py-2 text-[color:var(--color-text-soft)]">
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
                    // console.warn('[AdminAlerts] resolve failed:', e);
                  } finally {
                    setShowResolve(false);
                  }
                }}
                className="rounded-md bg-[color:var(--color-primary)] px-3 py-2 text-[color:var(--color-on-primary)]"
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