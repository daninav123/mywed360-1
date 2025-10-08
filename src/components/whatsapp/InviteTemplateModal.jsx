import React, { useEffect, useMemo, useState } from 'react';

import {
  getInviteTemplate,
  setInviteTemplate,
  renderInviteMessage,
} from '../../services/MessageTemplateService';
import wh from '../../utils/whDebug';
import Modal from '../Modal';

function InviteTemplateModal({ open, onClose, onSaved, coupleName = 'Ana y Luis' }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      const current = getInviteTemplate();
      setValue(current);
      try {
        wh('TemplateModal – open', { length: current?.length || 0 });
      } catch {}
    }
  }, [open]);

  const preview = useMemo(
    () => renderInviteMessage('María', { coupleName }),
    [value, coupleName]
  );

  const handleSave = () => {
    let next = value;
    if (next && !next.includes('{coupleName}')) {
      const confirmed = window.confirm(
        'El mensaje no incluye {coupleName}. Se añadirá automáticamente para identificar a la pareja.'
      );
      if (!confirmed) return;
      next = `${next.trim()}\n\nSomos {coupleName}`;
      setValue(next);
    }
    const ok = setInviteTemplate(next);
    if (ok) {
      try {
        wh('TemplateModal – saved', { length: next.length });
      } catch {}
      onSaved?.(next);
    } else {
      alert('No se pudo guardar la plantilla');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar mensaje (WhatsApp API)" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plantilla (soporta {`{guestName}`})
          </label>
          <textarea
            className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="¡Hola {guestName}! …"
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <div>Variables disponibles:</div>
            <div>{`{guestName}`} → María</div>
            <div>{`{coupleName}`} → {coupleName}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Previsualización</div>
          <div className="border rounded-md p-3 bg-gray-50 text-sm whitespace-pre-wrap">
            {preview}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="px-3 py-2 text-sm border rounded-md" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default InviteTemplateModal;
