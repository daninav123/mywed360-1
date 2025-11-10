import React, { useMemo } from 'react';

import { TABLE_TYPES, computeTableCapacity } from '../../utils/seatingTables';

const TABLE_TYPE_OPTIONS = TABLE_TYPES.map((type) => ({
  value: type.id,
  label: type.label,
}));

export default function TableEditor({ table, onChange, onClose, globalMaxSeats = 0 }) {
  if (!table) return null;

  const tableType = table.tableType || (table.shape === 'circle' ? 'round' : 'square');
  const autoCapacity = table.autoCapacity !== false;

  const recommendedCapacity = useMemo(
    () => computeTableCapacity({ ...table, tableType }),
    [table, tableType]
  );

  const handleInput = (field, parser = Number) => (e) => {
    const raw = e?.target?.value;
    const value = parser(raw);
    onChange(field, value);
  };

  const renderDimensionInputs = () => {
    if (tableType === 'round' || table.shape === 'circle') {
      return (
        <div>
          <label className="block text-xs text-gray-600 mb-1">Diámetro (cm)</label>
          <input
            type="number"
            min="60"
            max="400"
            value={table.diameter || 0}
            onChange={handleInput('diameter')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Largo (cm)</label>
          <input
            type="number"
            min="60"
            max="600"
            value={table.width || 0}
            onChange={handleInput('width')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Ancho (cm)</label>
          <input
            type="number"
            min="40"
            max="300"
            value={table.height || table.length || 0}
            onChange={handleInput('height')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
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
        <label className="block text-xs text-gray-600 mb-1">Tipo de mesa</label>
        <select
          value={tableType}
          onChange={handleInput('tableType', (v) => v)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          {TABLE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {renderDimensionInputs()}

      <div className="flex items-center gap-2">
        <input
          id="table-auto-capacity"
          type="checkbox"
          checked={autoCapacity}
          onChange={(e) => onChange('autoCapacity', e.target.checked)}
          className="h-3 w-3"
        />
        <label htmlFor="table-auto-capacity" className="text-xs text-gray-600">
          Calcular capacidad automáticamente
        </label>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Capacidad máxima</label>
        <input
          type="number"
          min="0"
          value={table.seats || 0}
          onChange={handleInput('seats')}
          disabled={autoCapacity}
          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
            autoCapacity ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        <p className="mt-1 text-[11px] text-gray-500">
          {autoCapacity
            ? `Capacidad sugerida según dimensiones: ${recommendedCapacity || 0} invitado(s)`
            : `Capacidad manual: ${table.seats || 0} invitado(s) · Sugerido: ${recommendedCapacity || 0}`}
        </p>
        {globalMaxSeats > 0 && (
          <p className="text-[11px] text-gray-400">
            Límite global permitido: {globalMaxSeats} invitado(s) por mesa.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Rotación (°)</label>
        <input
          type="number"
          min="-180"
          max="180"
          step="1"
          value={table.angle || 0}
          onChange={handleInput('angle')}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>

      {typeof onClose === 'function' && (
        <button
          onClick={onClose}
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
