import React, { useMemo, useState } from 'react';

import useTranslations from '../../hooks/useTranslations';
import Modal from '../Modal';
import Button from '../ui/Button';

const STATUS_ENTRIES = [
  { value: 'Nuevo', labelKey: 'common.suppliers.bulkStatusModal.options.new' },
  { value: 'Contactado', labelKey: 'common.suppliers.bulkStatusModal.options.contacted' },
  { value: 'RFQ enviado', labelKey: 'common.suppliers.bulkStatusModal.options.rfqSent' },
  { value: 'Oferta recibida', labelKey: 'common.suppliers.bulkStatusModal.options.offerReceived' },
  { value: 'Negociación', labelKey: 'common.suppliers.bulkStatusModal.options.negotiation' },
  { value: 'Seleccionado', labelKey: 'common.suppliers.bulkStatusModal.options.selected' },
  { value: 'Confirmado', labelKey: 'common.suppliers.bulkStatusModal.options.confirmed' },
  { value: 'Rechazado', labelKey: 'common.suppliers.bulkStatusModal.options.rejected' },
];

export default function BulkStatusModal({ open, onClose, onApply }) {
  const { t } = useTranslations();
  const statusOptions = useMemo(
    () =>
      STATUS_ENTRIES.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

  const [status, setStatus] = useState(STATUS_ENTRIES[1].value);
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

  const handleClose = () => onClose?.();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('common.suppliers.bulkStatusModal.title')}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('common.suppliers.bulkStatusModal.label')}
          </label>
          <select
            className="border rounded p-2 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {t('common.suppliers.bulkStatusModal.cancel')}
          </Button>
          <Button onClick={apply} disabled={loading}>
            {loading
              ? t('common.suppliers.bulkStatusModal.applying')
              : t('common.suppliers.bulkStatusModal.apply')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
