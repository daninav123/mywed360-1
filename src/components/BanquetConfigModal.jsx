import React, { useState } from 'react';

import Modal from './Modal';

export default function BanquetConfigModal({ open, onApply, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [seats, setSeats] = useState(8);
  const [gapX, setGapX] = useState(140);
  const [gapY, setGapY] = useState(160);

  const apply = () => {
    onApply({ rows: +rows, cols: +cols, seats: +seats, gapX: +gapX, gapY: +gapY });
    onClose();
  };

  return (
    <Modal open={open} title="Configurar Banquete" onClose={onClose}>
      <div className="flex flex-col space-y-2 w-60">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Filas de mesas</label>
          <input
            type="number"
            min="1"
            max="10"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            className="border rounded px-2 py-1 w-28 self-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Columnas de mesas</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cols}
            onChange={(e) => setCols(e.target.value)}
            className="border rounded px-2 py-1 w-28 self-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Asientos por mesa</label>
          <input
            type="number"
            min="1"
            max="20"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="border rounded px-2 py-1 w-28 self-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Espacio X</label>
          <input
            type="number"
            min="60"
            max="400"
            value={gapX}
            onChange={(e) => setGapX(e.target.value)}
            className="border rounded px-2 py-1 w-28 self-end"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-700">Espacio Y</label>
          <input
            type="number"
            min="60"
            max="400"
            value={gapY}
            onChange={(e) => setGapY(e.target.value)}
            className="border rounded px-2 py-1 w-28 self-end"
          />
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">
            Cancelar
          </button>
          <button onClick={apply} className="px-3 py-1 bg-blue-600 text-white rounded">
            Generar
          </button>
        </div>
      </div>
    </Modal>
  );
}
