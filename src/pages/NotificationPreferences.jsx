import React, { useEffect, useState } from 'react';

import PageWrapper from '../components/PageWrapper';
import { Card, Button } from '../components/ui';
import { useUserContext } from '../context/UserContext';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../services/notificationPreferencesService';

export default function NotificationPreferences() {
  const { user } = useUserContext();
  const [channels, setChannels] = useState({ email: true, inapp: true, push: false });
  const [quietHours, setQuietHours] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getNotificationPreferences(user);
        if (!mounted) return;
        const prefs = res?.preferences || {};
        setChannels(prefs.channels || { email: true, inapp: true, push: false });
        setQuietHours(prefs.quietHours || { start: '', end: '' });
      } catch (_) {
        setFeedback('No se pudieron cargar las preferencias. Intenta de nuevo mas tarde.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleToggle = (key) => {
    setChannels((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback('');
    try {
      const payload = {
        channels,
        quietHours: quietHours.start && quietHours.end ? quietHours : null,
      };
      await saveNotificationPreferences(user, payload);
      setFeedback('Preferencias guardadas correctamente.');
    } catch (e) {
      setFeedback('Error al guardar preferencias. Vuelve a intentarlo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Preferencias de notificacion" className="layout-container max-w-xl space-y-6">
        <Card className="text-sm text-[color:var(--color-muted)]">Cargando preferencias...</Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Preferencias de notificacion" className="layout-container max-w-xl space-y-6">
      <Card className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[color:var(--color-text)]">Canales activos</h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            Escoge los canales que quieres utilizar para recibir avisos importantes.
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => handleToggle('email')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              Email
            </label>
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.inapp}
                onChange={() => handleToggle('inapp')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              Notificaciones en la app
            </label>
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.push}
                onChange={() => handleToggle('push')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              Push (opcional)
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[color:var(--color-text)]">
            Horario de silencio (opcional)
          </h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            Define una franja en la que no enviaremos avisos. Dejalo vacio para recibir alertas en cualquier momento.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="22:00"
              value={quietHours.start}
              onChange={(event) =>
                setQuietHours((current) => ({ ...current, start: event.target.value }))
              }
            />
            <span className="text-sm text-[color:var(--color-muted)]">a</span>
            <input
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="07:00"
              value={quietHours.end}
              onChange={(event) =>
                setQuietHours((current) => ({ ...current, end: event.target.value }))
              }
            />
          </div>
        </section>

        <div className="flex items-center justify-between">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {feedback && (
            <span className="text-sm text-[color:var(--color-muted)]">{feedback}</span>
          )}
        </div>
      </Card>
    </PageWrapper>
  );
}
