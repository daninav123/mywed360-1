import React, { useEffect, useState } from 'react';

import { getAlertsData } from '../../services/adminDataService';

const severityLabels = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
};

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
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
                className={selected?.id === alert.id ? 'px-4 py-3 text-sm bg-[var(--color-bg-soft,#f3f4f6)] cursor-pointer' : 'px-4 py-3 text-sm cursor-pointer'}
                onClick={() => setSelected(alert)}
                data-testid="admin-alert-item"
              >
                <p className="font-medium">{alert.module}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{severityLabels[alert.severity]} · {alert.timestamp}</p>
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
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Selecciona una alerta.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAlerts;