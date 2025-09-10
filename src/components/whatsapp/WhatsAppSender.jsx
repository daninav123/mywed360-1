import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import { Button } from '../ui';
import { sendBatch } from '../../services/WhatsAppBatchService';

/**
 * WhatsAppSender
 * Modal para enviar invitaciones masivas por WhatsApp.
 * Props:
 *  - open: boolean
 *  - onClose: fn()
 *  - guests: array [{ id, name, phone }]
 *  - weddingId: string
 *  - defaultMessage: string (puede contener {guestName})
 *  - onBatchCreated: fn(batchResult)
 */
export default function WhatsAppSender({ open, onClose, guests = [], weddingId, defaultMessage = '', onBatchCreated }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(guests.filter(g => g.phone).map(g => g.id)));
  const [message, setMessage] = useState(defaultMessage || '¡Hola {guestName}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const list = useMemo(() => guests.filter(g => g.phone), [guests]);

  const handleSend = async () => {
    if (!selectedIds.size) { setError('Selecciona al menos un invitado'); return; }
    setSending(true); setError('');
    try {
      const res = await sendBatch({
        weddingId,
        guestIds: Array.from(selectedIds),
        messageTemplate: message,
      });
      if (onBatchCreated) onBatchCreated(res);
      onClose();
    } catch (e) {
      console.error(e);
      setError('No se pudo crear el lote');
    } finally { setSending(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Enviar invitaciones por WhatsApp" size="lg">
      <div className="space-y-4">
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <div className="text-xs text-gray-500">Puedes usar la variable {'{guestName}'} que se reemplazará automáticamente.</div>

        <div className="max-h-60 overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr><th className="px-2 py-1"><input type="checkbox" checked={selectedIds.size===list.length} onChange={e=>setSelectedIds(e.target.checked? new Set(list.map(g=>g.id)) : new Set())}/></th><th className="px-2 py-1 text-left">Nombre</th><th className="px-2 py-1">Teléfono</th></tr>
            </thead>
            <tbody>
              {list.map(g=> (
                <tr key={g.id} className="border-t">
                  <td className="px-2 py-1 text-center"><input type="checkbox" checked={selectedIds.has(g.id)} onChange={()=>toggleId(g.id)}/></td>
                  <td className="px-2 py-1">{g.name}</td>
                  <td className="px-2 py-1">{g.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending}>{sending ? 'Generando...' : `Enviar a ${selectedIds.size}`}</Button>
        </div>
      </div>
    </Modal>
  );
}
