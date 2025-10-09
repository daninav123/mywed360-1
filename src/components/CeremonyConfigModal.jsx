import React, { useState, useEffect } from 'react';

import Modal from './Modal';

/**
 * Modal para configurar la parrilla de sillas de la ceremonia
 * Props:
 *  - open: boolean
 *  - onApply(config): callback con { rows, cols, gap, aisleAfter, vipRows, vipLabel, lockVipSeats, notes }
 *  - onClose: cerrar
 *  - initialConfig: configuración previa de ceremoniaSettings
 */
export default function CeremonyConfigModal({ open, onApply, onClose, initialConfig }) {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(12);
  const [gap, setGap] = useState(40);
  const [aisleAfter, setAisleAfter] = useState(6);
  const [vipRowsInput, setVipRowsInput] = useState('');
  const [vipLabel, setVipLabel] = useState('VIP');
  const [lockVipSeats, setLockVipSeats] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const normalized = initialConfig && typeof initialConfig === 'object' ? initialConfig : {};
    setRows(Number.isFinite(normalized.rows) ? normalized.rows : 10);
    setCols(Number.isFinite(normalized.cols) ? normalized.cols : 12);
    setGap(Number.isFinite(normalized.gap) ? normalized.gap : 40);
    setAisleAfter(
      Number.isFinite(normalized.aisleAfter) && normalized.aisleAfter >= 0
        ? normalized.aisleAfter
        : 6
    );
    const vipRows = Array.isArray(normalized.vipRows)
      ? normalized.vipRows
          .map((value) => Number.parseInt(value, 10))
          .filter((value) => Number.isFinite(value) && value >= 0)
      : [];
    setVipRowsInput(vipRows.length ? vipRows.map((value) => value + 1).join(', ') : '');
    setVipLabel(typeof normalized.vipLabel === 'string' && normalized.vipLabel.trim()
      ? normalized.vipLabel.trim()
      : 'VIP');
    setLockVipSeats(!!normalized.lockVipSeats);
    setNotes(typeof normalized.notes === 'string' ? normalized.notes : '');
  }, [open, initialConfig]);

  const totalSeats = rows * cols;

  const apply = () => {
    const vipRows = vipRowsInput
      .split(/[,\s]+/)
      .map((value) => Number.parseInt(value, 10) - 1)
      .filter((value) => Number.isFinite(value) && value >= 0);
    onApply({
      rows: +rows,
      cols: +cols,
      gap: +gap,
      aisleAfter: +aisleAfter,
      vipRows,
      vipLabel,
      lockVipSeats,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Modal open={open} title="Configurar ceremonia" onClose={onClose}>
      <div className="flex flex-col space-y-3 w-full max-w-sm">
        <div className="grid grid-cols-1 gap-2">
          <label className="flex justify-between items-center">
            <span>Filas:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </label>
          <label className="flex justify-between items-center">
            <span>Sillas por fila:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={cols}
              onChange={(e) => setCols(e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </label>
          <label className="flex justify-between items-center">
            <span>Espacio entre sillas (cm):</span>
            <input
              type="number"
              min="20"
              max="200"
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </label>
          <label className="flex justify-between items-center">
            <span>Pasillo después de col:</span>
            <input
              type="number"
              min="0"
              max={Math.max(0, Number(cols) - 1)}
              value={aisleAfter}
              onChange={(e) => setAisleAfter(e.target.value)}
              className="border rounded px-2 py-1 w-24"
            />
          </label>
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Reservas VIP</p>
          <label className="flex flex-col text-sm text-gray-700 gap-1">
            Filas reservadas (ej. 1,2)
            <input
              type="text"
              value={vipRowsInput}
              onChange={(e) => setVipRowsInput(e.target.value)}
              placeholder="1, 2"
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-700 gap-1">
            Etiqueta para asientos reservados
            <input
              type="text"
              value={vipLabel}
              onChange={(e) => setVipLabel(e.target.value)}
              className="border rounded px-2 py-1"
              maxLength={40}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={lockVipSeats}
              onChange={(e) => setLockVipSeats(e.target.checked)}
            />
            Bloquear asientos VIP hasta asignarlos manualmente
          </label>
          <label className="flex flex-col text-sm text-gray-700 gap-1">
            Notas internas
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="border rounded px-2 py-1 text-sm resize-none"
              placeholder="Ej. Reservar para padrinos y padres"
            />
          </label>
        </div>

        <p className="text-sm text-gray-600 mt-1">Total de sillas: {totalSeats}</p>
        <div className="flex justify-end space-x-2 mt-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">
            Cancelar
          </button>
          <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">
            Guardar configuración
          </button>
        </div>
      </div>
    </Modal>
  );
}
