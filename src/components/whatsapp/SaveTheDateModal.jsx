import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Modal from '../Modal';
import { Button } from '../ui';
import { toE164, sendText, getProviderStatus } from '../../services/whatsappService';

/**
 * SaveTheDateModal
 * - Permite enviar un mensaje de "Save the Date" por WhatsApp (API) a múltiples invitados
 * - Soporta mensaje general y personalización por invitado
 * Props:
 *  - open: boolean
 *  - onClose: fn
 *  - guests: array [{ id, name, phone }]
 *  - defaultMessage: string
 *  - weddingId: string
 *  - selectedDefaultIds?: array (opcional, ids seleccionados por defecto)
 */
export default function SaveTheDateModal({ open, onClose, guests = [], defaultMessage = '', weddingId, selectedDefaultIds = [] }) {
  const guestsWithPhone = useMemo(() => (guests || []).filter(g => !!g.phone), [guests]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [messageGlobal, setMessageGlobal] = useState(defaultMessage);
  const [messages, setMessages] = useState({}); // guestId -> message
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null); // {ok, fail}
  const [provider, setProvider] = useState({ configured: false, provider: 'twilio' });
  const [loadingProvider, setLoadingProvider] = useState(false);

  // Inicializar selección y mensajes por defecto al abrir
  useEffect(() => {
    if (!open) return;
    const initialIds = new Set(
      (selectedDefaultIds && selectedDefaultIds.length)
        ? selectedDefaultIds
        : guestsWithPhone.map(g => g.id)
    );
    setSelectedIds(initialIds);
    // Mensaje por defecto por invitado = messageGlobal actual (o defaultMessage prop)
    const base = (defaultMessage && defaultMessage.trim()) ? defaultMessage : messageGlobal;
    const map = {};
    for (const g of guestsWithPhone) { map[g.id] = base || ''; }
    setMessages(map);
    setStats(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setMessageGlobal(defaultMessage || '');
  }, [defaultMessage]);

  // Comprobar proveedor API al abrir
  useEffect(() => {
    if (!open) return;
    setLoadingProvider(true);
    getProviderStatus()
      .then((s) => setProvider({ configured: !!s?.configured, provider: s?.provider || 'twilio' }))
      .catch(() => setProvider({ configured: false, provider: 'twilio' }))
      .finally(() => setLoadingProvider(false));
  }, [open]);

  const toggleId = useCallback((id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked) => {
    if (checked) setSelectedIds(new Set(guestsWithPhone.map(g => g.id)));
    else setSelectedIds(new Set());
  }, [guestsWithPhone]);

  const applyGlobalToAll = useCallback(() => {
    const text = messageGlobal || '';
    setMessages(prev => {
      const copy = { ...prev };
      for (const g of guestsWithPhone) copy[g.id] = text;
      return copy;
    });
  }, [messageGlobal, guestsWithPhone]);

  const selectedCount = selectedIds.size;

  const handleSend = useCallback(async () => {
    if (!selectedCount) { alert('Selecciona al menos un invitado'); return; }
    if (!provider.configured) { alert('El proveedor de WhatsApp API no está configurado. Por favor, configúralo antes de enviar.'); return; }
    setSending(true);
    setStats(null);
    let ok = 0, fail = 0;
    try {
      for (const g of guestsWithPhone) {
        if (!selectedIds.has(g.id)) continue;
        try {
          const to = toE164(String(g.phone || ''));
          const msg = (messages[g.id] || messageGlobal || '').trim();
          if (!to || !msg) { fail++; continue; }
          const res = await sendText({ to, message: msg, weddingId, guestId: g.id, metadata: { type: 'save_the_date', guestName: g.name || '' } });
          if (res?.success) ok++; else fail++;
          // pequeño respiro para respetar rate limits
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 200));
        } catch {
          fail++;
        }
      }
      setStats({ ok, fail });
      alert(`Envío completado. Éxitos: ${ok}, Fallos: ${fail}`);
      onClose?.();
    } finally {
      setSending(false);
    }
  }, [guestsWithPhone, selectedIds, messages, messageGlobal, weddingId, selectedCount, onClose, provider]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Enviar SAVE THE DATE" size="lg">
      <div className="space-y-4">
        <div className="text-sm">
          {loadingProvider ? (
            <div className="px-3 py-2 rounded bg-gray-50 text-gray-600">Comprobando proveedor de WhatsApp API…</div>
          ) : provider.configured ? (
            <div className="px-3 py-2 rounded bg-green-50 text-green-700">Proveedor API configurado ({provider.provider?.toUpperCase?.() || 'TWILIO'})</div>
          ) : (
            <div className="px-3 py-2 rounded bg-amber-50 text-amber-800 border border-amber-200">
              El proveedor de WhatsApp API no está configurado. No podrás enviar el Save the Date hasta configurarlo.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mensaje general</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm"
            rows={4}
            value={messageGlobal}
            onChange={e => setMessageGlobal(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="outline" onClick={applyGlobalToAll}>Aplicar a todos</Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">Personaliza el mensaje por invitado si lo necesitas.</div>

        <div className="max-h-[50vh] overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === guestsWithPhone.length && guestsWithPhone.length > 0}
                    onChange={e => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-2 py-2 text-left">Nombre</th>
                <th className="px-2 py-2 text-left">Teléfono</th>
                <th className="px-2 py-2 text-left" style={{minWidth: 260}}>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {guestsWithPhone.map(g => (
                <tr key={g.id} className="border-t align-top">
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={selectedIds.has(g.id)} onChange={e => toggleId(g.id, e.target.checked)} />
                  </td>
                  <td className="px-2 py-2">{g.name || '-'}</td>
                  <td className="px-2 py-2">{g.phone}</td>
                  <td className="px-2 py-2">
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      rows={2}
                      value={messages[g.id] ?? ''}
                      onChange={e => setMessages(prev => ({ ...prev, [g.id]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stats && (
          <div className="text-sm text-gray-700">Resultado: Éxitos {stats.ok}, Fallos {stats.fail}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending || !selectedCount || !provider.configured}>{sending ? 'Enviando...' : `Enviar a ${selectedCount}`}</Button>
        </div>
      </div>
    </Modal>
  );
}
