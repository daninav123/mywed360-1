import React, { useState } from 'react';
import Modal from '../Modal';
import Button from '../ui/Button';

const STATUSES = [
  'Nuevo',
  'Contactado',
  'RFQ enviado',
  'Oferta recibida',
  'Negociación',
  'Seleccionado',
  'Confirmado',
  'Rechazado'
];

export default function BulkStatusModal({ open, onClose, onApply }) {
  const [status, setStatus] = useState('Contactado');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      await onApply?.(status);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cambiar estado">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nuevo estado</label>
          <select className="border rounded p-2 w-full" value={status} onChange={(e)=>setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={apply} disabled={loading}>{loading ? 'Aplicando…' : 'Aplicar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

