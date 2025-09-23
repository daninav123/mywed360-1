import React, { useState } from 'react';

import Modal from './Modal';

export default function TableConfigModal({ open, table, onSave, onClose }) {
  const [shape, setShape] = useState(table.shape || 'circle');
  const [name, setName] = useState(table.name || '');
  const [seats, setSeats] = useState(table.seats || 8);

  const save = () => {
    onSave({ ...table, shape, name, seats });
    onClose();
  };

  return (
    <Modal open={open} title={`Configurar Mesa ${table.id}`} onClose={onClose}>
      <div className="flex flex-col space-y-2">
        <label className="flex justify-between items-center">
          <span>Nombre:</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-2 py-1 w-32"
          />
        </label>
        <label className="flex justify-between items-center">
          <span>Forma:</span>
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value)}
            className="border rounded px-2 py-1 w-32"
          >
            <option value="circle">Circular</option>
            <option value="rect">Rectangular</option>
          </select>
        </label>
        <label className="flex justify-between items-center">
          <span>Asientos:</span>
          <input
            type="number"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(+e.target.value)}
            className="border rounded px-2 py-1 w-20"
          />
        </label>
        <div className="flex justify-end mt-4 space-x-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">
            Cancelar
          </button>
          <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
