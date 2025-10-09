import React, { useEffect, useState } from 'react';

import { getBroadcastData } from '../../services/adminDataService';

const AdminBroadcast = () => {
  const [tab, setTab] = useState('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState('Todos');
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBroadcast = async () => {
      setLoading(true);
      const data = await getBroadcastData();
      setHistory(data || []);
      setLoading(false);
    };
    loadBroadcast();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Broadcast global</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Envía comunicaciones a segmentos específicos o a todos los usuarios.</p>
      </header>

      <div className="rounded-xl border border-soft bg-surface shadow-sm">
        <div className="flex border-b border-soft text-sm">
          <button
            type="button"
            data-testid="broadcast-tab-email"
            onClick={() => setTab('email')}
            className={tab === 'email' ? 'flex-1 px-4 py-3 bg-[var(--color-bg-soft,#f3f4f6)] font-medium' : 'flex-1 px-4 py-3'}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setTab('push')}
            className={tab === 'push' ? 'flex-1 px-4 py-3 bg-[var(--color-bg-soft,#f3f4f6)] font-medium' : 'flex-1 px-4 py-3'}
          >
            Push
          </button>
        </div>
        <form className="space-y-4 px-4 py-5 text-sm">
          <div className="space-y-1">
            <label className="font-medium" htmlFor="broadcast-subject">
              Asunto
            </label>
            <input
              id="broadcast-subject"
              data-testid="broadcast-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2"
              placeholder="Mantenimiento programado"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium" htmlFor="broadcast-content">
              Contenido
            </label>
            <textarea
              id="broadcast-content"
              data-testid="broadcast-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2"
              rows={6}
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium" htmlFor="broadcast-segment">
              Segmento
            </label>
            <select
              id="broadcast-segment"
              data-testid="broadcast-segment"
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2"
            >
              <option>Todos</option>
              <option>Solo planners</option>
              <option>Solo owners</option>
              <option value="custom">Custom tag</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="broadcast-schedule-toggle"
              checked={scheduled}
              onChange={(event) => setScheduled(event.target.checked)}
            />
            Programar envío
          </label>
          {scheduled && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                data-testid="broadcast-schedule-date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className="rounded-md border border-soft px-3 py-2"
              />
              <input
                type="time"
                data-testid="broadcast-schedule-time"
                value={scheduleTime}
                onChange={(event) => setScheduleTime(event.target.value)}
                className="rounded-md border border-soft px-3 py-2"
              />
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="broadcast-confirm"
              className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
            >
              Confirmar envío
            </button>
          </div>
        </form>
      </div>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h2 className="text-sm font-semibold">Histórico</h2>
        </header>
        {loading ? (
          <div className="px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">Cargando histórico...</div>
        ) : (
          <table className="min-w-full divide-y divide-soft text-sm">
            <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
              <tr>
                <th className="px-4 py-3 text-left">Asunto</th>
                <th className="px-4 py-3 text-left">Segmento</th>
                <th className="px-4 py-3 text-left">Programado</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.subject}</td>
                  <td className="px-4 py-3">{item.segment}</td>
                  <td className="px-4 py-3">{item.scheduledAt}</td>
                  <td className="px-4 py-3">{item.status}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={4}>
                    No hay envíos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminBroadcast;