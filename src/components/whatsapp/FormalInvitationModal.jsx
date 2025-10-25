import React, { useEffect, useMemo, useState } from 'react';

import Modal from '../Modal';
import { Button } from '../ui';
import { Input } from '../ui';
import { useTranslations } from '../../hooks/useTranslations';

const ensureSet = (ids = []) => new Set(Array.isArray(ids) ? ids : []);

const requiresCoupleSignature = (text = '', coupleName = '') => {
  const { t } = useTranslations();

  if (!coupleName) return true;
  const normalized = coupleName.trim().toLowerCase();
  if (!normalized) return true;
  const message = text.toLowerCase();
  return message.includes(normalized) || text.includes('{coupleName}');
};

export default function FormalInvitationModal({
  open,
  onClose,
  guests = [],
  coupleName = '',
  defaultMessage = '',
  defaultAssetUrl = '',
  selectedDefaultIds = [],
  onSendWhatsApp,
  onMarkDelivery,
}) {
  const guestsWithDetails = useMemo(() => guests || [], [guests]);
  const [selectedIds, setSelectedIds] = useState(() => ensureSet(selectedDefaultIds));
  const [message, setMessage] = useState(defaultMessage || '');
  const [assetUrl, setAssetUrl] = useState(defaultAssetUrl || '');
  const [instagramPollId, setInstagramPollId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(() => {
      if (selectedDefaultIds && selectedDefaultIds.length) {
        return ensureSet(selectedDefaultIds);
      }
      const defaults = guestsWithDetails.filter((g) => g.phone).map((g) => g.id);
      return ensureSet(defaults);
    });
    setMessage(defaultMessage || '');
    setAssetUrl(defaultAssetUrl || '');
    setInstagramPollId('');
    setSending(false);
  }, [open, guestsWithDetails, defaultMessage, defaultAssetUrl, selectedDefaultIds]);

  const toggleId = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    if (checked) setSelectedIds(ensureSet(guestsWithDetails.map((g) => g.id)));
    else setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;

  const handleSend = async () => {
    if (!selectedCount) {
      alert('Selecciona al menos un invitado');
      return;
    }
    if (!requiresCoupleSignature(message, coupleName)) {
      alert('El mensaje debe incluir el nombre de la pareja o la variable {coupleName}.');
      return;
    }
    setSending(true);
    try {
      const result = await onSendWhatsApp?.({
        guestIds: Array.from(selectedIds),
        message,
        assetUrl,
        instagramPollId: instagramPollId.trim() || undefined,
      });
      if (result?.success) {
        onClose?.();
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelivery = async (channel) => {
    if (!selectedCount) {
      alert('Selecciona al menos un invitado');
      return;
    }
    if (!assetUrl) {
      alert(t('common.anade_url_invitacion_disenada_antes'));
      return;
    }
    setSending(true);
    try {
      const result = await onMarkDelivery?.({
        guestIds: Array.from(selectedIds),
        channel,
        assetUrl,
      });
      if (result?.success) {
        onClose?.();
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={t('common.invitacion_formal')} size="lg">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Personaliza el mensaje, adjunta la invitación final y decide cómo enviarla. El mensaje debe
          identificar claramente a la pareja porque se envía desde un número común de la app.
        </div>

        <div>
          <label className="block text-sm font-medium text-body mb-1">Mensaje</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm min-h-[120px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted mt-1">
            Usa las variables {'{guestName}'} y {'{coupleName}'} para personalizar. Actualmente: {coupleName || '—'}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-body mb-1">URL invitación (imagen/PDF)</label>
            <Input
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="https://..."
              disabled={sending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-body mb-1">ID encuesta Instagram (opcional)</label>
            <Input
              value={instagramPollId}
              onChange={(e) => setInstagramPollId(e.target.value)}
              placeholder="poll_123"
              disabled={sending}
            />
            <p className="text-xs text-muted mt-1">
              Se guardará la respuesta como nota del invitado cuando la encuesta devuelva resultados.
            </p>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === guestsWithDetails.length && guestsWithDetails.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-2 py-2 text-left">Invitado</th>
                <th className="px-2 py-2 text-left">Teléfono</th>
                <th className="px-2 py-2 text-left">Mesa</th>
              </tr>
            </thead>
            <tbody>
              {guestsWithDetails.map((guest) => (
                <tr key={guest.id} className="border-t align-top">
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(guest.id)}
                      onChange={(e) => toggleId(guest.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="font-medium">{guest.name || '-'}</div>
                    {guest.email && <div className="text-xs text-muted">{guest.email}</div>}
                  </td>
                  <td className="px-2 py-2">{guest.phone || '-'}</td>
                  <td className="px-2 py-2">{guest.table || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-sm text-muted">Seleccionados: {selectedCount}</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDelivery('print_owner')}
              disabled={sending || !selectedCount}
            >
              Pedido para entrega en persona
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDelivery('print_guest')}
              disabled={sending || !selectedCount}
            >
              Pedido envío postal
            </Button>
            <Button onClick={handleSend} disabled={sending || !selectedCount}>
              {sending ? 'Procesando…' : 'Enviar por WhatsApp'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
