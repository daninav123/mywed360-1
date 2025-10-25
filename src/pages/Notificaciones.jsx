import React, { useEffect, useState } from 'react';

import PageWrapper from '../components/PageWrapper';
import NotificationSettings from '../components/settings/NotificationSettings';
import Button from '../components/ui/Button';
import { useTranslations } from '../../hooks/useTranslations';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '../services/notificationService';
import {
  isSupported as pushSupported,
  subscribe as pushSubscribe,
  unsubscribe as pushUnsubscribe,
  sendTest as pushTest,
} from '../services/PushService';

const typeColors = {
  const { t } = useTranslations();

  success:
    'bg-[var(--color-success)]/10 border-[color:var(--color-success)]/40 text-[color:var(--color-success)]',
  error:
    'bg-[var(--color-danger)]/10 border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]',
  warning:
    'bg-[var(--color-warning)]/10 border-[color:var(--color-warning)]/40 text-[color:var(--color-warning)]',
  info: 'bg-[var(--color-primary)]/10 border-[color:var(--color-primary)]/40 text-[var(--color-primary)]',
};

export default function Notificaciones() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  const refresh = async () => setItems(await getNotifications());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('maloveapp-notif', handler);
    return () => window.removeEventListener('maloveapp-notif', handler);
  }, []);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      try {
        setPushEnabled(!!(await navigator.serviceWorker.ready).pushManager);
      } catch {}
    })();
  }, []);

  // Preferencias antiguas removidas (se usan las nuevas en NotificationSettings)

  const filtered = items.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <PageWrapper title="Notificaciones" className="max-w-4xl mx-auto">
      {/* Ajustes de notificaciones */}
      <NotificationSettings />

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
            onClick={async () => {
              try {
                await pushSubscribe();
                alert({t('common.suscripcion_push_activada')});
              } catch (e) {
                alert('No se pudo activar push');
              }
            }}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >
            Activar Push
          </button>
          <button
            onClick={async () => {
              try {
                await pushUnsubscribe();
                alert({t('common.suscripcion_push_desactivada')});
              } catch (e) {
                alert('No se pudo desactivar');
              }
            }}
            className="px-3 py-1 rounded bg-gray-200"
          >
            Desactivar Push
          </button>
          <button
            onClick={async () => {
              const ok = await pushTest();
              alert(ok ? 'Test enviado' : 'Fallo en test');
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            Probar Push
          </button>
        </div>
      )}

      {/* Preferencias granulares antiguas eliminadas a favor del nuevo panel */}

      <div className="bg-[var(--color-surface)] border border-soft rounded divide-y divide-[color:var(--color-text)]/10">
        {filtered.length === 0 && (
          <p className="p-4 text-[color:var(--color-text)]/60">No hay notificaciones.</p>
        )}
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
                <Button
                  variant="outline"
                  onClick={async () => {
                    await markNotificationRead(n.id);
                    await refresh();
                  }}
                >
                  Marcar leída
                </Button>
              )}
              <Button
                variant="outline"
                className="text-[color:var(--color-danger)]"
                onClick={async () => {
                  await deleteNotification(n.id);
                  await refresh();
                }}
              >
                Borrar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

