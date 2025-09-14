import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { getNotifications, markNotificationRead, deleteNotification } from '../services/notificationService';

const typeColors = {
  success: 'bg-[var(--color-success)]/10 border-[color:var(--color-success)]/40 text-[color:var(--color-success)]',
  error: 'bg-[var(--color-danger)]/10 border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]',
  warning: 'bg-[var(--color-warning)]/10 border-[color:var(--color-warning)]/40 text-[color:var(--color-warning)]',
  info: 'bg-[var(--color-primary)]/10 border-[color:var(--color-primary)]/40 text-[var(--color-primary)]',
};

export default function Notificaciones() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);

  const refresh = async () => setItems(await getNotifications());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('lovenda-notif', handler);
    return () => window.removeEventListener('lovenda-notif', handler);
  }, []);

  const filtered = items.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="p-4 space-y-4 text-[color:var(--color-text)]">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text)]/10'}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text)]/10'}`}
        >
          Sin leer
        </button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[color:var(--color-text)]/10 rounded divide-y divide-[color:var(--color-text)]/10">
        {filtered.length === 0 && <p className="p-4 text-[color:var(--color-text)]/60">No hay notificaciones.</p>}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex justify-between p-4 text-sm ${typeColors[n.type] || typeColors.info}`}
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <span className="text-xs text-[color:var(--color-text)]/60">
                {new Date(n.date).toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex gap-2 items-start ml-4">
              {!n.read && (
                <Button variant="outline" onClick={async () => { await markNotificationRead(n.id); await refresh(); }}>
                  Marcar leída
                </Button>
              )}
              <Button variant="outline" className="text-[color:var(--color-danger)]" onClick={async () => { await deleteNotification(n.id); await refresh(); }}>
                Borrar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

