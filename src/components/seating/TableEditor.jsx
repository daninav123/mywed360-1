import React from 'react';

export default function TableEditor({ table, onChange, onClose }) {
  if (!table) return null;

  const handleInput = (field) => (e) => {
    const value = field === 'shape' ? e.target.value : parseInt(e.target.value, 10);
    onChange(field, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Nombre</label>
        <input
          type="text"
          value={table.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Forma</label>
        <select
          value={table.shape || 'rectangle'}
          onChange={handleInput('shape')}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="rectangle">Rectángulo</option>
          <option value="circle">Círculo</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Número de sillas</label>
        <input
          type="number"
          min="1"
          value={table.seats || 8}
          onChange={handleInput('seats')}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      <button
        onClick={onClose}
        className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Cerrar
      </button>
    </div>
  );
}
