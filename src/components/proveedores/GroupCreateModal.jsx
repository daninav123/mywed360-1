import React, { useState } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

export default function GroupCreateModal({ open, onClose, onConfirm, defaultName = '' }) {
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState('');
  const { t } = useTranslations();

  const handleConfirm = () => {
    if (!name?.trim()) return;
    onConfirm?.({ name: name.trim(), notes: notes.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('common.suppliers.groupCreateModal.title')}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('common.suppliers.groupCreateModal.nameLabel')}
          </label>
          <input
            className="w-full border rounded-md p-2"
            placeholder={t('common.suppliers.groupCreateModal.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('common.suppliers.groupCreateModal.notesLabel')}
          </label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            placeholder={t('common.suppliers.groupCreateModal.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.suppliers.groupCreateModal.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('common.suppliers.groupCreateModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
