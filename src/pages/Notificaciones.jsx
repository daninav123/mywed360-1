import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { getNotifications, markNotificationRead, deleteNotification } from '../services/notificationService';
import { isSupported as pushSupported, subscribe as pushSubscribe, unsubscribe as pushUnsubscribe, sendTest as pushTest } from '../services/PushService';

const typeColors = {
  success: 'bg-[var(--color-success)]/10 border-[color:var(--color-success)]/40 text-[color:var(--color-success)]',
  error: 'bg-[var(--color-danger)]/10 border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]',
  warning: 'bg-[var(--color-warning)]/10 border-[color:var(--color-warning)]/40 text-[color:var(--color-warning)]',
  info: 'bg-[var(--color-primary)]/10 border-[color:var(--color-primary)]/40 text-[var(--color-primary)]',
};

export default function Notificaciones() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pushPrefs') || '{}'); } catch { return {}; }
  });

  const refresh = async () => setItems(await getNotifications());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('lovenda-notif', handler);
    return () => window.removeEventListener('lovenda-notif', handler);
  }, []);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      try { setPushEnabled(!!(await navigator.serviceWorker.ready).pushManager); } catch {}
    })();
  }, []);

  // Guardar preferencias
  useEffect(() => {
    try { localStorage.setItem('pushPrefs', JSON.stringify(prefs)); } catch {}
  }, [prefs]);

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

      {pushSupported() && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={async ()=>{ try { await pushSubscribe(); alert('Suscripción push activada'); } catch(e){ alert('No se pudo activar push'); } }}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >Activar Push</button>
          <button
            onClick={async ()=>{ try { await pushUnsubscribe(); alert('Suscripción push desactivada'); } catch(e){ alert('No se pudo desactivar'); } }}
            className="px-3 py-1 rounded bg-gray-200"
          >Desactivar Push</button>
          <button
            onClick={async ()=>{ const ok = await pushTest(); alert(ok ? 'Test enviado' : 'Fallo en test'); }}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >Probar Push</button>
        </div>
      )}

      {/* Preferencias granulares */}
      <div className="border rounded p-3">
        <h2 className="font-semibold mb-2">Preferencias de Push</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { key: 'email', label: 'Correos nuevos/importantes' },
            { key: 'rsvp', label: 'RSVP y recordatorios' },
            { key: 'tasks', label: 'Tareas y reuniones' },
            { key: 'providers', label: 'Proveedores y pagos' },
            { key: 'legal', label: 'Contratos/Documentos' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2">
              <input type="checkbox" checked={!!prefs[opt.key]} onChange={(e)=> setPrefs(prev => ({ ...prev, [opt.key]: e.target.checked }))} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Estas preferencias se guardan en este dispositivo y podrán usarse para filtrar alertas en próximas versiones del backend.</p>
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

