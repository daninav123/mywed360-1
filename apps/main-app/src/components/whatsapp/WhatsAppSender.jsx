import React, { useMemo, useState } from 'react';

import { sendBatch } from '../../services/WhatsAppBatchService';
import Modal from '../Modal';
import { Button } from '../ui';

/**
 * WhatsAppSender
 * Modal para enviar invitaciones masivas por WhatsApp.
 * Props:
 *  - open: boolean
 *  - onClose: fn()
 *  - guests: array [{ id, name, phone }]
 *  - weddingId: string
 *  - defaultMessage: string (puede contener {guestName} y {coupleName})
 *  - onBatchCreated: fn(batchResult)
 *  - coupleName: string (se usa como fallback para firmar los mensajes)
 */
export default function WhatsAppSender({
  open,
  onClose,
  guests = [],
  weddingId,
  defaultMessage = '',
  onBatchCreated,
  coupleName = 'nuestra boda',
}) {
  const guestsWithPhone = useMemo(() => (guests || []).filter((g) => !!g.phone), [guests]);
  const [selectedIds, setSelectedIds] = useState(() => new Set(guestsWithPhone.map((g) => g.id)));
  const [message, setMessage] = useState(
    defaultMessage ||
      '�Hola {guestName}! Somos {coupleName} y nos encantar�a contar contigo en nuestra boda. �Puedes confirmar tu asistencia?'
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (checked) => {
    if (checked) setSelectedIds(new Set(guestsWithPhone.map((g) => g.id)));
    else setSelectedIds(new Set());
  };

  const handleSend = async () => {
    if (!selectedIds.size) {
      setError('Selecciona al menos un invitado');
      return;
    }
    const trimmed = (message || '').trim();
    if (!trimmed) {
      setError('El mensaje no puede estar vac�o');
      return;
    }
    if (!coupleName) {
      setError('Define el nombre de la pareja para firmar el mensaje');
      return;
    }

    const normalizedCouple = coupleName.trim();
    const templateWithCouple = trimmed.includes('{coupleName}')
      ? trimmed.replaceAll('{coupleName}', normalizedCouple)
      : trimmed.toLowerCase().includes(normalizedCouple.toLowerCase())
        ? trimmed
        : `${trimmed}\n\n${normalizedCouple}`;

    setSending(true);
    setError('');
    try {
      const res = await sendBatch({
        weddingId,
        guestIds: Array.from(selectedIds),
        messageTemplate: templateWithCouple,
      });
      onBatchCreated?.(res);
      onClose?.();
    } catch (e) {
      // console.error(e);
      setError('No se pudo crear el lote');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Enviar invitaciones por WhatsApp" size="lg">
      <div className="space-y-4">
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="text-xs text-gray-500">
          Puedes usar las variables {'{guestName}'} y {'{coupleName}'} que se reemplazar�n autom�ticamente.
        </div>

        <div className="max-h-60 overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === guestsWithPhone.length && guestsWithPhone.length > 0}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-2 py-1 text-left">Nombre</th>
                <th className="px-2 py-1">Tel�fono</th>
              </tr>
            </thead>
            <tbody>
              {guestsWithPhone.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(g.id)}
                      onChange={() => toggleId(g.id)}
                    />
                  </td>
                  <td className="px-2 py-1">{g.name || '-'}</td>
                  <td className="px-2 py-1">{g.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Generando...' : `Enviar a ${selectedIds.size}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
