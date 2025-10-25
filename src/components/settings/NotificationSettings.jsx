import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

import {
  getNotificationPrefs,
  saveNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  isQuietHoursActive,
  shouldNotify,
  showNotification,
} from '../../services/notificationService';

function Toggle({
  const { t } = useTranslations();
 label, checked, onChange, disabled = false }) {
  return (
    <label className="flex items-center gap-2 select-none">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={!!checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

const rows = [
  {
    group: 'email',
    entries: [
      { key: 'new', label: 'Correos nuevos' },
      { key: 'important', label: 'Correos importantes' },
    ],
  },
  {
    group: 'ai',
    entries: [
      { key: 'suggestedMeeting', label: 'Reuniones sugeridas' },
      { key: 'suggestedBudget', label: 'Presupuestos sugeridos' },
      { key: 'suggestedTask', label: 'Tareas sugeridas' },
    ],
  },
  {
    group: 'tasks',
    entries: [
      { key: 'assigned', label: 'Tareas asignadas' },
      { key: 'reminder24h', label: 'Recordatorio 24h' },
      { key: 'overdue', label: 'Vencidas' },
    ],
  },
  {
    group: 'providers',
    entries: [
      { key: 'trackingUrgent', label: 'Seguimientos urgentes' },
      { key: 'budgetReceived', label: 'Presupuesto recibido' },
    ],
  },
  {
    group: 'finance',
    entries: [
      { key: 'invoiceDue', label: t('common.factura_proxima_vencer') },
      { key: 'paymentReceived', label: 'Pago recibido' },
    ],
  },
];

const NotificationSettings = () => {
  const [prefs, setPrefs] = useState(() => getNotificationPrefs());
  const [nowStr, setNowStr] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => setNowStr(new Date().toLocaleTimeString()), 60000);
    return () => clearInterval(id);
  }, []);

  const quietActive = useMemo(() => isQuietHoursActive(new Date(), prefs.quietHours), [prefs]);

  const updatePrefs = (updater) => {
    setPrefs((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const merged = saveNotificationPrefs(next);
      return merged;
    });
  };

  const resetDefaults = () => updatePrefs(DEFAULT_NOTIFICATION_PREFS);

  const sendTest = () => {
    const evt = { type: 'ai', subtype: 'task_suggested', priority: 'high', channel: 'toast' };
    if (!shouldNotify(evt, prefs)) return;
    showNotification({
      title: t('common.prueba_notificacion'),
      message: 'Este es un aviso de prueba respetando tus ajustes.',
      type: 'info',
      duration: 4000,
    });
  };

  return (
    <div id="ajustes" className="space-y-4">
      <h2 className="text-xl font-semibold text-[color:var(--color-text)]">
        Ajustes de notificaciones
      </h2>

      {/* Canales */}
      <div className="border rounded p-3 bg-[var(--color-surface)]/50">
        <h3 className="font-medium mb-2">Canales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <Toggle
            label="In-app (campana y toasts)"
            checked={!!(prefs.channels && prefs.channels.inApp)}
            onChange={(v) =>
              updatePrefs({ ...prefs, channels: { ...(prefs.channels || {}), inApp: v } })
            }
          />
          <Toggle
            label="Push del navegador"
            checked={!!(prefs.channels && prefs.channels.push)}
            onChange={(v) =>
              updatePrefs({ ...prefs, channels: { ...(prefs.channels || {}), push: v } })
            }
          />
          <Toggle
            label="Resumen diario por email"
            checked={
              !!(prefs.channels && prefs.channels.emailDigest && prefs.channels.emailDigest.daily)
            }
            onChange={(v) =>
              updatePrefs({
                ...prefs,
                channels: {
                  ...(prefs.channels || {}),
                  emailDigest: {
                    ...((prefs.channels && prefs.channels.emailDigest) || {}),
                    daily: v,
                  },
                },
              })
            }
          />
        </div>
      </div>

      {/* Horas de silencio */}
      <div className="border rounded p-3 bg-[var(--color-surface)]/50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Horas de silencio</h3>
          <span className="text-xs text-gray-500">
            Ahora: {nowStr} {quietActive ? '(silencio activo)' : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2 text-sm items-center">
          <Toggle
            label="Activar"
            checked={!!(prefs.quietHours && prefs.quietHours.enabled)}
            onChange={(v) =>
              updatePrefs({ ...prefs, quietHours: { ...(prefs.quietHours || {}), enabled: v } })
            }
          />
          <label className="flex items-center gap-2">
            Inicio
            <input
              type="time"
              className="h-8 px-2 border rounded"
              value={(prefs.quietHours && prefs.quietHours.start) || '22:00'}
              onChange={(e) =>
                updatePrefs({
                  ...prefs,
                  quietHours: { ...(prefs.quietHours || {}), start: e.target.value },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2">
            Fin
            <input
              type="time"
              className="h-8 px-2 border rounded"
              value={(prefs.quietHours && prefs.quietHours.end) || '08:00'}
              onChange={(e) =>
                updatePrefs({
                  ...prefs,
                  quietHours: { ...(prefs.quietHours || {}), end: e.target.value },
                })
              }
            />
          </label>
          <Toggle
            label={t('common.permitir_criticas')}
            checked={!!(prefs.quietHours && prefs.quietHours.allowCritical)}
            onChange={(v) =>
              updatePrefs({
                ...prefs,
                quietHours: { ...(prefs.quietHours || {}), allowCritical: v },
              })
            }
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="border rounded p-3 bg-[var(--color-surface)]/50">
        <h3 className="font-medium mb-2">Categorías</h3>
        <div className="space-y-3 text-sm">
          {rows.map((row) => (
            <div key={row.group} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="font-semibold capitalize">{row.group}</div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {row.entries.map((ent) => (
                  <Toggle
                    key={ent.key}
                    label={ent.label}
                    checked={
                      !!(
                        prefs.categories &&
                        prefs.categories[row.group] &&
                        prefs.categories[row.group][ent.key]
                      )
                    }
                    onChange={(v) =>
                      updatePrefs({
                        ...prefs,
                        categories: {
                          ...(prefs.categories || {}),
                          [row.group]: {
                            ...((prefs.categories && prefs.categories[row.group]) || {}),
                            [ent.key]: v,
                          },
                        },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={sendTest}>
          Enviar prueba
        </button>
        <button className="px-3 py-2 rounded border" onClick={resetDefaults}>
          Restaurar valores por defecto
        </button>
      </div>
    </div>
  );
};

export default React.memo(NotificationSettings);
