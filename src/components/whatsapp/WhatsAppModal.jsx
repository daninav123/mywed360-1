import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui';
import { MessageSquare, Smartphone, Send, Settings } from 'lucide-react';
import { getProviderStatus, getHealth, getMetrics, toE164, waDeeplink } from '../../services/whatsappService';

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
  onSendApi,      // (guest, message)
  onSendApiBulk,  // () masivo a pendientes
}) {
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
    getProviderStatus().then((s) => {
      setProvider({ configured: !!s.configured, provider: s.provider || 'twilio' });
    }).catch(() => setProvider({ configured: false, provider: 'twilio' }))
      .finally(() => setLoadingProvider(false));
    // Cargar health (no bloqueante)
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, [open]);

  const canSend = !!guest && !!guest.phone;

  function buildDefaultMessage(g) {
    if (!g) return 'Â¡Hola! Queremos invitarte a nuestra boda. Â¿Puedes confirmar tu asistencia?';
    return `Â¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. Â¿Puedes confirmar tu asistencia?`;
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
      alert('El proveedor de WhatsApp API aún no está configurado.');
      return;
    }
    await onSendApi?.(guest, message);
  }, [canSend, provider, onSendApi, guest, message]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <h3 className="font-semibold">Enviar por WhatsApp</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Ã—</button>
        </div>

        <div className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex space-x-6 border-b mb-4">
              <TabsTrigger value="personal" className="pb-2 flex items-center gap-2">
                <Smartphone size={16} /> Móvil personal
              </TabsTrigger>
              <TabsTrigger value="api" className="pb-2 flex items-center gap-2">
                <Send size={16} /> Número de la app
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <p className="text-sm text-gray-600">
                Se abrirá WhatsApp en tu dispositivo con el mensaje preparado. Podrás confirmar el envío manualmente.
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <input id="useBusiness" type="checkbox" checked={useBusinessApp} onChange={(e) => setUseBusinessApp(e.target.checked)} />
                  <label htmlFor="useBusiness">Abrir en WhatsApp Business</label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSendPersonal} disabled={!canSend}>Enviar a este invitado</Button>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  Estado del proveedor: {loadingProvider ? 'Comprobandoâ€¦' : (provider.configured ? 'Configurado' : 'No configurado')}
                </div>
                <Settings size={14} /> {provider.provider?.toUpperCase?.() || 'TWILIO'}
              </div>
              {health && (
                <div>
                  <div className="text-xs text-gray-600">
                    Health: {health.success ? 'OK' : 'Degradado'} {health.status?.fallback ? `(fallback: ${health.status.fallback})` : ''}
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
                      Ver métricas
                    </button>
                    {showMetrics && (
                      <div className="mt-2 border rounded p-2 bg-gray-50">
                        {loadingMetrics ? (
                          <div>Cargando métricasâ€¦</div>
                        ) : metrics ? (
                          <div className="text-[11px] text-gray-700">
                            <div>Total: {metrics.total || 0}</div>
                            <div>Entrega: {Math.round((metrics.rates?.deliveryRate || 0) * 100)}%</div>
                            <div>Lectura: {Math.round((metrics.rates?.readRate || 0) * 100)}%</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Mensaje</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
                <Button onClick={handleSendApi} disabled={!canSend || !provider.configured}>Enviar a este invitado</Button>
                <Button variant="outline" onClick={onSendApiBulk} title="Enviar a invitados pendientes (API)">Másivo: pendientes</Button>
              </div>
              {!provider.configured && (
                <div className="mt-2 text-xs text-gray-500">
                  Nota: El proveedor API no está listo. Puedes usar la pestaña &quot;Móvil personal&quot; (deeplink) como alternativa.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


