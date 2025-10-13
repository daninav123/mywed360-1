import React, { useEffect, useMemo, useState } from 'react';

import { getAuditLogs } from '../../services/adminDataService';

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadLogs = async () => {
      setLoading(true);
      const data = await getAuditLogs();
      if (!mounted) return;
      setLogs(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    loadLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!actionFilter) return logs;
    return logs.filter((log) => log.action === actionFilter);
  }, [logs, actionFilter]);

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando auditoría...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Auditoría</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Registro detallado de acciones administrativas.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">
            Acción
            <select
              data-testid="audit-filter-action"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="ml-2 rounded-md border border-soft px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="FLAG_UPDATE">FLAG_UPDATE</option>
              <option value="USER_SUSPEND">USER_SUSPEND</option>
              <option value="BROADCAST_SEND">BROADCAST_SEND</option>
            </select>
          </label>
          <button
            type="button"
            data-testid="audit-filter-apply"
            className="rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
          >
            Aplicar
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-soft bg-surface shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-soft text-sm" data-testid="audit-table">
          <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Acción</th>
              <th className="px-4 py-3 text-left">Recurso</th>
              <th className="px-4 py-3 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {filtered.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">{log.createdAt}</td>
                <td className="px-4 py-3">{log.actor}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.resourceId}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">{log.payload}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={5}>
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          data-testid="audit-export-csv"
          className="rounded-md border border-soft px-4 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
        >
          Exportar CSV
        </button>
        <button
          type="button"
          data-testid="audit-export-json"
          className="rounded-md border border-soft px-4 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
        >
          Exportar JSON
        </button>
      </div>
    </div>
  );
};

export default AdminAudit;
