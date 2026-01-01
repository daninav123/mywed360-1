import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import PageWrapper from '../components/PageWrapper';
import NotificationSettings from '../components/settings/NotificationSettings';
import Button from '../components/ui/Button';
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
  success:
    'bg-[var(--color-success-10)] border-[color:var(--color-success-40)] text-[color:var(--color-success)]',
  error:
    'bg-[var(--color-danger-10)] border-[color:var(--color-danger-40)] text-[color:var(--color-danger)]',
  warning:
    'bg-[var(--color-warning-10)] border-[color:var(--color-warning-40)] text-[color:var(--color-warning)]',
  info: 'bg-[var(--color-primary-10)] border-[color:var(--color-primary-40)] text-[color:var(--color-primary)]',
};

export default function Notificaciones() {
  const { t } = useTranslations();
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
    <div className="p-6">
      {/* Ajustes de notificaciones */}
      <NotificationSettings />

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text-10)]'}`}
        >
          {t('notifications.filters.all')}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text-10)]'}`}
        >
          {t('notifications.filters.unread')}
        </button>
      </div>

      {pushSupported() && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                await pushSubscribe();
                toast.success(t('notifications.push.enableSuccess'));
              } catch (e) {
                toast.error(t('notifications.push.enableError'));
              }
            }}
            className="px-3 py-1 rounded  text-white" style={{ backgroundColor: 'var(--color-success)' }}
          >
            {t('notifications.push.enable')}
          </button>
          <button
            onClick={async () => {
              try {
                await pushUnsubscribe();
                toast.success(t('notifications.push.disableSuccess'));
              } catch (e) {
                toast.error(t('notifications.push.disableError'));
              }
            }}
            className="px-3 py-1 rounded bg-gray-200"
          >
            {t('notifications.push.disable')}
          </button>
          <button
            onClick={async () => {
              const ok = await pushTest();
              ok ? toast.success(t('notifications.push.testSuccess')) : toast.error(t('notifications.push.testError'));
            }}
            className="px-3 py-1 rounded  text-white" style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('notifications.push.test')}
          </button>
        </div>
      )}

      {/* Preferencias granulares antiguas eliminadas a favor del nuevo panel */}

      <div className="bg-[var(--color-surface)] border border-soft rounded divide-y divide-[color:var(--color-text-10)]">
        {filtered.length === 0 && (
          <p className="p-4 text-[color:var(--color-text-60)]">{t('notifications.empty')}</p>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex justify-between p-4 text-sm ${typeColors[n.type] || typeColors.info}`}
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <span className="text-xs text-[color:var(--color-text-60)]">
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
                  {t('notifications.markRead')}
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
                {t('notifications.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
