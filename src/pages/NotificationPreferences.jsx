import React, { useEffect, useState } from 'react';

import PageWrapper from '../components/PageWrapper';
import { Card, Button } from '../components/ui';
import { useUserContext } from '../context/UserContext';
import useTranslations from '../hooks/useTranslations';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../services/notificationPreferencesService';

export default function NotificationPreferences() {
  const { user } = useUserContext();
  const { t } = useTranslations();
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
        setFeedback(t('notificationPreferences.loadError'));
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
      setFeedback(t('notificationPreferences.saveSuccess'));
    } catch (e) {
      setFeedback(t('notificationPreferences.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title={t('notificationPreferences.title')} className="layout-container max-w-xl space-y-6">
        <Card className="text-sm text-[color:var(--color-muted)]">{t('notificationPreferences.loading')}</Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={t('notificationPreferences.title')} className="layout-container max-w-xl space-y-6">
      <Card className="space-y-5">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[color:var(--color-text)]">{t('notificationPreferences.channels.title')}</h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            {t('notificationPreferences.channels.description')}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => handleToggle('email')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              {t('notificationPreferences.channels.email')}
            </label>
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.inapp}
                onChange={() => handleToggle('inapp')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              {t('notificationPreferences.channels.inapp')}
            </label>
            <label className="flex items-center gap-3 text-sm text-[color:var(--color-text)]">
              <input
                type="checkbox"
                checked={channels.push}
                onChange={() => handleToggle('push')}
                className="h-4 w-4 rounded border-[color:var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              {t('notificationPreferences.channels.push')}
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[color:var(--color-text)]">
            {t('notificationPreferences.quietHours.title')}
          </h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            {t('notificationPreferences.quietHours.description')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder={t('notificationPreferences.quietHours.startPlaceholder')}
              value={quietHours.start}
              onChange={(event) =>
                setQuietHours((current) => ({ ...current, start: event.target.value }))
              }
            />
            <span className="text-sm text-[color:var(--color-muted)]">{t('notificationPreferences.quietHours.from')}</span>
            <input
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder={t('notificationPreferences.quietHours.endPlaceholder')}
              value={quietHours.end}
              onChange={(event) =>
                setQuietHours((current) => ({ ...current, end: event.target.value }))
              }
            />
          </div>
        </section>

        <div className="flex items-center justify-between">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('notificationPreferences.saving') : t('notificationPreferences.save')}
          </Button>
          {feedback && (
            <span className="text-sm text-[color:var(--color-muted)]">{feedback}</span>
          )}
        </div>
      </Card>
    </PageWrapper>
  );
}
