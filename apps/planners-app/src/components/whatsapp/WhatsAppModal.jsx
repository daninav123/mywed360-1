import { MessageSquare, Smartphone, Send, Settings, Phone } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getProviderStatus,
  getHealth,
  getMetrics,
  toE164,
  waDeeplink,
} from '../../services/whatsappService';
import useTranslations from '../../hooks/useTranslations';
import { Button } from '../ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';

/**
 * Modal de Envío por WhatsApp
 * - Pestaña 1: Móvil personal (deeplink)
 * - Pestaña 2: Número de la app (API WhatsApp Business)
 */
export default function WhatsAppModal({
  open,
  onClose,
  guest,
  defaultMessage = '',
  onSendDeeplink, // (guest, message)
  onSendApi, // (guest, message)
  onSendApiBulk, // () masivo a pendientes
}) {
  const { t } = useTranslations();
  const [tab, setTab] = useState('personal');
  const [message, setMessage] = useState(defaultMessage);
  const [useBusinessApp, setUseBusinessApp] = useState(false);
  const [provider, setProvider] = useState({ configured: false, provider: 'twilio' });
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [health, setHealth] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    setMessage(defaultMessage || buildDefaultMessage(guest));
  }, [defaultMessage, guest]);

  useEffect(() => {
    if (!open) return;
    setLoadingProvider(true);
    getProviderStatus()
      .then((s) => {
        setProvider({ configured: !!s.configured, provider: s.provider || 'twilio' });
      })
      .catch(() => setProvider({ configured: false, provider: 'twilio' }))
      .finally(() => setLoadingProvider(false));
    // Cargar health (no bloqueante)
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, [open]);

  const canSend = !!guest && !!guest.phone;

  function buildDefaultMessage(g) {
    if (!g) return t('whatsapp.modal.defaultMessage.generic');
    return t('whatsapp.modal.defaultMessage.named', { name: g.name || '' });
  }

  const deeplinkHref = useMemo(() => {
    try {
      if (!guest?.phone) return '#';
      const text = message && message.trim() ? message : buildDefaultMessage(guest);
      const phoneE164 = toE164(guest.phone);
      if (!phoneE164) return '#';
      const encoded = encodeURIComponent(text);
      if (useBusinessApp) {
        // Android: whatsapp-business
        // iOS puede no admitirlo; los navegadores pueden bloquearlo; se intenta best-effort
        const ph = phoneE164.replace(/^\+/, '');
        return `whatsapp-business://send?phone=${ph}&text=${encoded}`;
      }
      return waDeeplink(phoneE164, text);
    } catch {
      return '#';
    }
  }, [guest, message, useBusinessApp]);

  const handleSendPersonal = useCallback(() => {
    if (!canSend) return;
    if (onSendDeeplink) {
      onSendDeeplink(guest, message);
    } else {
      // Fallback: abrir el enlace directamente
      window.open(deeplinkHref, '_blank');
    }
  }, [canSend, onSendDeeplink, guest, message, deeplinkHref]);

  const handleSendApi = useCallback(async () => {
    if (!canSend) return;
    if (!provider.configured) {
      toast.error(t('whatsapp.providerNotConfigured'));
      return;
    }
    await onSendApi?.(guest, message);
  }, [canSend, provider, onSendApi, guest, message]);

  if (!open) return null;

  const providerStatusText = loadingProvider
    ? t('whatsapp.modal.api.status.checking')
    : provider.configured
      ? t('whatsapp.modal.api.status.configured')
      : t('whatsapp.modal.api.status.notConfigured');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface w-full max-w-2xl rounded-lg shadow-lg border border-soft">
        <div className="flex items-center justify-between px-4 py-3 border-b border-soft">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <h3 className="font-semibold">{t('whatsapp.modal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-body"
            aria-label={t('app.close')}
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex space-x-6 border-b mb-4">
              <TabsTrigger value="personal" className="pb-2 flex items-center gap-2">
                <Smartphone size={16} /> {t('whatsapp.modal.tabs.personal')}
              </TabsTrigger>
              <TabsTrigger value="api" className="pb-2 flex items-center gap-2">
                <Send size={16} /> {t('whatsapp.modal.tabs.api')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <p className="text-sm text-muted">
                {t('whatsapp.modal.personal.description')}
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('whatsapp.modal.labels.message')}
                </label>
                <textarea
                  className="w-full border border-soft rounded-md p-2 text-sm min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    id="useBusiness"
                    type="checkbox"
                    checked={useBusinessApp}
                    onChange={(e) => setUseBusinessApp(e.target.checked)}
                  />
                  <label htmlFor="useBusiness">{t('whatsapp.modal.personal.businessToggle')}</label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  {t('app.cancel')}
                </Button>
                <Button onClick={handleSendPersonal} disabled={!canSend}>
                  {t('whatsapp.modal.actions.sendSingle')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  {t('whatsapp.modal.api.providerStatusLine', { status: providerStatusText })}
                </div>
                <div className="flex items-center gap-1">
                  <Settings size={14} />{' '}
                  {t('whatsapp.modal.api.providerName', {
                    provider: provider.provider?.toUpperCase?.() || 'TWILIO',
                  })}
                </div>
              </div>
              {health && (
                <div>
                  <div className="text-xs text-muted">
                    {t('whatsapp.modal.api.healthLabel', {
                      status: health.success
                        ? t('whatsapp.modal.api.healthStatus.ok')
                        : t('whatsapp.modal.api.healthStatus.degraded'),
                    })}{' '}
                    {health.status?.fallback
                      ? t('whatsapp.modal.api.healthFallback', {
                          value: health.status.fallback,
                        })
                      : ''}
                  </div>
                  <div className="text-xs">
                    <button
                      className="underline"
                      onClick={async () => {
                        try {
                          setLoadingMetrics(true);
                          const res = await getMetrics({});
                          setMetrics(res);
                        } finally {
                          setLoadingMetrics(false);
                          setShowMetrics((s) => !s);
                        }
                      }}
                    >
                      {t('whatsapp.modal.api.viewMetrics')}
                    </button>
                    {showMetrics && (
                      <div className="mt-2 border rounded p-2 bg-surface">
                        {loadingMetrics ? (
                          <div>{t('whatsapp.modal.api.metrics.loading')}</div>
                        ) : metrics ? (
                          <div className="text-[11px] text-body">
                            <div>
                              {t('whatsapp.modal.api.metrics.total', {
                                value: metrics.total || 0,
                              })}
                            </div>
                            <div>
                              {t('whatsapp.modal.api.metrics.delivery', {
                                percentage: Math.round((metrics.rates?.deliveryRate || 0) * 100),
                              })}
                            </div>
                            <div>
                              {t('whatsapp.modal.api.metrics.read', {
                                percentage: Math.round((metrics.rates?.readRate || 0) * 100),
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('whatsapp.modal.labels.message')}
                </label>
                <textarea
                  className="w-full border border-soft rounded-md p-2 text-sm min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  {t('app.close')}
                </Button>
                <Button onClick={handleSendApi} disabled={!canSend || !provider.configured}>
                  {t('whatsapp.modal.actions.sendSingle')}
                </Button>
                <Button
                  variant="outline"
                  onClick={onSendApiBulk}
                  title={t('whatsapp.modal.actions.sendBulkPendingTitle')}
                >
                  {t('whatsapp.modal.actions.sendBulkPending')}
                </Button>
              </div>
              {!provider.configured && (
                <div className="mt-2 text-xs text-muted">
                  {t('whatsapp.modal.api.noteUnconfigured')}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
