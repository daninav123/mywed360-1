import React, { useState } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import { useTranslations } from '../../hooks/useTranslations';

export default function GroupCreateModal({

 open, onClose, onConfirm, defaultName = '' }) {
  const { t } = useTranslations();

  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!name?.trim()) return;
    onConfirm?.({ name: name.trim(), notes: notes.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} title="Unificar proveedores">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del grupo</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder={t('common.paquete_musica_toro_mecanico')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            placeholder={t('common.detalles_del_alcance_combinado_logistica')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Crear grupo</Button>
        </div>
      </div>
    </Modal>
  );
}
