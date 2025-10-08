import { Settings, Copy, Trash2, Users } from 'lucide-react';
import React, { useMemo } from 'react';

import TableEditor from './TableEditor';
import { TABLE_TYPES, computeTableCapacity } from '../../utils/seatingTables';

export default function SeatingInspectorPanel({
  selectedTable,
  tab,
  globalMaxSeats = 0,
  onTableDimensionChange,
  onConfigureTable,
  duplicateTable,
  deleteTable,
  toggleTableLocked,
  assignedGuests = [],
  onUnassignGuest,
  className = '',
}) {
  if (!selectedTable) {
    return (
      <div className={`bg-white border rounded-lg h-full flex items-center justify-center text-gray-500 ${className}`}>
        Selecciona una mesa o zona para ver sus propiedades
      </div>
    );
  }

  const selectedTableType = useMemo(() => {
    if (!selectedTable) return null;
    const typeId =
      selectedTable.tableType ||
      (selectedTable.shape === 'circle' ? 'round' : 'square');
    return TABLE_TYPES.find((t) => t.id === typeId) || null;
  }, [selectedTable?.tableType, selectedTable?.shape]);

  const recommendedCapacity = useMemo(() => {
    if (!selectedTable) return 0;
    return computeTableCapacity(selectedTable);
  }, [selectedTable]);

  const assignedGuestsWithCompanions = useMemo(
    () =>
      assignedGuests.reduce(
        (sum, guest) => sum + 1 + (parseInt(guest?.companion, 10) || 0),
        0
      ),
    [assignedGuests]
  );

  const remainingCapacity = selectedTable
    ? (selectedTable.seats || 0) - assignedGuestsWithCompanions
    : 0;

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            {selectedTable.name || `Mesa ${selectedTable.id}`}
          </h3>
          <button
            onClick={() => onConfigureTable?.(selectedTable)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Configurar"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {tab === 'banquet' && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/60">
            <TableEditor
              table={selectedTable}
              onChange={onTableDimensionChange}
              onClose={() => {}}
              globalMaxSeats={globalMaxSeats}
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tipo:</span>
            <span className="font-medium capitalize">
              {tab === 'ceremony' ? 'Ceremonia' : 'Banquete'}
            </span>
          </div>

          {tab === 'banquet' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tipo de mesa:</span>
                <span className="font-medium">
                  {selectedTableType?.label || 'Personalizada'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-medium">
                  {selectedTable.seats || 0} invitados
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Asignados (incluye acompañantes): {assignedGuestsWithCompanions}
              </div>
              <div className="text-xs text-gray-500">
                {selectedTable.autoCapacity !== false
                  ? `Calculado automáticamente (sugerido ${recommendedCapacity || 0})`
                  : `Capacidad manual. Recomendado: ${recommendedCapacity || 0}`}
              </div>
              <div
                className={`text-xs ${
                  remainingCapacity < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {remainingCapacity < 0
                  ? `Capacidad excedida por ${Math.abs(remainingCapacity)} invitado(s)`
                  : `Quedan ${remainingCapacity} invitado(s) disponibles`}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
            <Users className="h-4 w-4" /> Invitados asignados ({assignedGuests.length})
          </h4>
          {assignedGuests.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {assignedGuests.map((guest, index) => (
                <div key={guest.id || index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <div>
                    <div className="font-medium text-blue-800">{guest.name}</div>
                    {guest.side && <div className="text-xs text-blue-600 capitalize">{guest.side}</div>}
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                    onClick={() => onUnassignGuest?.(guest.id)}
                    title="Quitar de la mesa"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Sin invitados asignados</div>
          )}
        </div>

        <div className="pt-3 border-t space-y-2">
          <button
            onClick={() => onConfigureTable?.(selectedTable)}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Configurar mesa
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => duplicateTable?.(selectedTable.id)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              title="Duplicar mesa"
            >
              <Copy className="h-4 w-4" /> Duplicar
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Eliminar esta mesa?')) deleteTable?.(selectedTable.id);
              }}
              className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
              title="Eliminar mesa"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
            <button
              onClick={() => toggleTableLocked?.(selectedTable.id)}
              className="col-span-2 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
              title={selectedTable?.locked ? 'Desbloquear mesa' : 'Bloquear mesa'}
            >
              {selectedTable?.locked ? 'Desbloquear mesa' : 'Bloquear mesa'}
            </button>
          </div>
          {tab === 'banquet' && (
            <div className="text-[11px] text-gray-500">Capacidad global: {globalMaxSeats || '--'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
