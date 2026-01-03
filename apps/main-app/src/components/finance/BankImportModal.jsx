import React from 'react';

import Modal from '../Modal';
import { Button } from '../ui';

export default function BankImportModal({
  open,
  onClose,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onImport,
  isLoading,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Importar movimientos bancarios">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <p className="text-sm text-[color:var(--color-text-70)]">
              Conecta tu cuenta bancaria usando GoCardless (ex Nordigen) y luego importa por fecha.
            </p>
          </div>
          <div>
            <label className="block text-sm text-[color:var(--color-text-80)] mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text-20)] bg-[var(--color-surface)] text-[color:var(--color-text)] focus:ring-[color:var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[color:var(--color-text-80)] mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent border-[color:var(--color-text-20)] bg-[var(--color-surface)] text-[color:var(--color-text)] focus:ring-[color:var(--color-primary)]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onImport} disabled={isLoading}>
            Importar
          </Button>
        </div>
        <p className="text-xs text-[color:var(--color-text-60)]">
          Requiere backend con GoCardless (ex Nordigen) configurado.
        </p>
      </div>
    </Modal>
  );
}
