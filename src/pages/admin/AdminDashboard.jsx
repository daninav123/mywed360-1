import React, { useEffect, useState } from 'react';

import { getDashboardData } from '../../services/adminDataService';

const severityColors = {
  critical: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
};

const serviceStatusMap = {
  operational: { label: 'Operativo', className: 'text-green-600' },
  degraded: { label: 'Degradado', className: 'text-amber-600' },
  down: { label: 'Caído', className: 'text-red-600' },
};

const trendClass = (value) => (value >= 0 ? 'text-green-600' : 'text-red-600');
const trendArrow = (value) => (value >= 0 ? '▲' : '▼');

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState([]);
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const data = await getDashboardData();
      setKpis(data.kpis);
      setServices(data.services);
      setAlerts(data.alerts);
      setTasks(data.tasks);
      setLoading(false);
    };
    loadDashboard();
  }, []);

  const openResolveModal = (alert) => setSelectedAlert(alert);
  const closeResolveModal = () => setSelectedAlert(null);

  const handleResolveAlert = () => {
    if (!selectedAlert) return;
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === selectedAlert.id ? { ...alert, resolved: true } : alert
      )
    );
    closeResolveModal();
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: 'task-' + Date.now(), title: newTaskTitle.trim(), completed: false },
    ]);
    setNewTaskTitle('');
    setShowTaskModal(false);
  };

  const toggleTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando panel de administración...
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.id}
            data-testid={kpi.testId || kpi.id}
            className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm"
          >
            <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">{kpi.label}</p>
            <p className="mt-3 text-2xl font-semibold">{kpi.value}</p>
            {typeof kpi.trend === 'number' && (
              <p className={'mt-1 text-xs font-medium ' + trendClass(kpi.trend)}>
                {trendArrow(kpi.trend)} {Math.abs(kpi.trend)}%
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => {
          const status = serviceStatusMap[service.status] || serviceStatusMap.operational;
          return (
            <article
              key={service.id || service.name}
              data-testid={'service-health-' + (service.testId || service.id || 'unknown')}
              className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm"
            >
              <header className="flex items-center justify-between text-sm">
                <span className="font-medium">{service.name}</span>
                <span className={status.className}>{status.label}</span>
              </header>
              <dl className="mt-4 space-y-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                <div className="flex justify-between">
                  <dt>Latencia media</dt>
                  <dd>{service.latency || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Incidentes 30d</dt>
                  <dd>{service.incidents ?? 0}</dd>
                </div>
              </dl>
              <button type="button" className="mt-4 text-xs font-medium text-[color:var(--color-primary,#6366f1)]">
                Ver detalles
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-soft bg-surface shadow-sm">
          <header className="flex items-center justify-between border-b border-soft px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Alertas críticas</h2>
              <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Monitorea incidentes activos.</p>
            </div>
          </header>
          <ul className="divide-y divide-soft">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                data-testid="admin-alert-item"
                data-status={alert.resolved ? 'resolved' : 'pending'}
                className={'px-4 py-3 text-sm ' + (severityColors[alert.severity] || '')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.module}</p>
                    <p className="text-xs">{alert.message}</p>
                    <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{alert.timestamp}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!alert.resolved && (
                      <button
                        type="button"
                        data-testid="admin-alert-resolve"
                        onClick={() => openResolveModal(alert)}
                        className="rounded-md border border-soft px-3 py-1 text-xs font-medium text-[color:var(--color-primary,#6366f1)] hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                      >
                        Marcar resuelta
                      </button>
                    )}
                    <button type="button" className="text-xs text-[var(--color-text-soft,#6b7280)]">
                      Ver detalle
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {alerts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
                Sin alertas activas
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-soft bg-surface shadow-sm">
          <header className="flex items-center justify-between border-b border-soft px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Tareas admin</h2>
              <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Seguimiento manual prioritario.</p>
            </div>
            <button
              type="button"
              data-testid="admin-task-add"
              onClick={() => setShowTaskModal(true)}
              className="rounded-md border border-soft px-3 py-1 text-xs text-[color:var(--color-primary,#6366f1)]"
            >
              Añadir tarea
            </button>
          </header>
          <ul className="divide-y divide-soft">
            {tasks.map((task) => (
              <li
                key={task.id}
                data-testid="admin-task-item"
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  <span className={task.completed ? 'line-through text-[var(--color-text-soft,#6b7280)]' : ''}>
                    {task.title}
                  </span>
                </label>
              </li>
            ))}
            {tasks.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
                No hay tareas pendientes
              </li>
            )}
          </ul>
        </div>
      </section>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" data-testid="admin-alert-resolve-modal">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Resolver alerta</h3>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                {selectedAlert.message}
              </p>
            </div>
            <textarea
              data-testid="admin-alert-resolve-notes"
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
              rows={4}
              placeholder="Describe la acción tomada"
            />
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={closeResolveModal} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="admin-alert-resolve-confirm"
                onClick={handleResolveAlert}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" data-testid="admin-task-modal">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Nueva tarea</h3>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Añade un recordatorio a la lista de tareas administrativas.
              </p>
            </div>
            <input
              data-testid="admin-task-title"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2 text-sm"
              placeholder="Descripción de la tarea"
            />
            <div className="flex justify-end gap-3 text-sm">
              <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-2 text-[var(--color-text-soft,#6b7280)]">
                Cancelar
              </button>
              <button
                type="button"
                data-testid="admin-task-submit"
                onClick={handleAddTask}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-[color:var(--color-on-primary,#ffffff)]"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;