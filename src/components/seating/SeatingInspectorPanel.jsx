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
  guests = [],
  ceremonyRows = [],
  ceremonyActiveRow = 0,
  onSelectCeremonyRow,
  ceremonySuggestions = {},
  onAssignCeremonyGuest,
  className = '',
}) {
  if (tab === 'ceremony') {
    const rows = Array.isArray(ceremonyRows) ? ceremonyRows : [];
    const safeIndex =
      rows.length === 0
        ? -1
        : Math.min(Math.max(Number.isInteger(ceremonyActiveRow) ? ceremonyActiveRow : 0, 0), rows.length - 1);
    const activeRow = safeIndex >= 0 ? rows[safeIndex] : null;
    const activeRowSeats = activeRow ? activeRow.seats : [];
    const seatSummaries = activeRowSeats.map((seat) => {
      let label = seat?.guestName || '';
      if (!label && seat?.guestId) {
        const guest =
          Array.isArray(guests) &&
          guests.find((g) => String(g?.id) === String(seat.guestId));
        label = guest?.name || `Invitado ${seat.guestId}`;
      }
      if (!label) {
        label = seat?.enabled === false ? 'Reservado / bloqueado' : 'Disponible';
      }
      return {
        id: seat?.id,
        label,
        disabled: seat?.enabled === false,
        assigned: !!seat?.guestId,
      };
    });

    const vipTitle =
      vipLabel && vipLabel !== 'VIP' ? `${vipLabel} / VIP` : 'Padrinos / VIP';
    const suggestionBuckets = [
      {
        key: 'padrinos',
        title: vipTitle,
        description: vipLabel
          ? `Invitados marcados como ${vipLabel} o roles VIP.`
          : 'Invitados marcados como padrinos o con roles VIP.',
      },
      {
        key: 'familiares',
        title: 'Familia cercana',
        description: 'Familia directa pendiente de asignar.',
      },
      {
        key: 'otros',
        title: 'Pendientes',
        description: 'Otros invitados sin asiento asignado en la ceremonia.',
      },
    ];

    return (
      <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-medium text-gray-900">Ceremonia · Gestión rápida</h3>
          <p className="text-xs text-gray-500">
            Controla filas VIP, capacidad disponible y asigna invitados destacados sin salir del plano.
          </p>
        </div>

        <div className="p-4 space-y-5">
          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Fila activa</h4>
              <span className="text-xs text-gray-500">
                {rows.length > 0 ? `${rows.length} filas` : 'Sin filas generadas'}
              </span>
            </header>
            {rows.length === 0 ? (
              <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded p-3">
                Genera la parrilla de ceremonia desde la barra superior para comenzar a configurar asientos.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {rows.map((row) => {
                    const isActive = row.index === safeIndex;
                    return (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => onSelectCeremonyRow?.(row.index)}
                        className={`px-3 py-1.5 rounded border text-xs transition flex items-center gap-2 ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600'
                            : row.reservedLabel
                              ? 'border-amber-400 text-amber-800 bg-amber-50/60 hover:bg-amber-50'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">{row.label}</span>
                        <span className="ml-2 text-[11px] opacity-80">
                          {row.assignedCount}/{row.enabledCount}
                        </span>
                        {row.reservedLabel && (
                          <span className="px-1.5 py-0.5 text-[10px] uppercase rounded bg-amber-100 text-amber-700 font-semibold">
                            {row.reservedLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeRow ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                      <div className="border rounded-lg bg-blue-50/60 border-blue-100 p-3">
                        <p className="font-semibold text-blue-800 text-sm">Capacidad</p>
                        <p>
                          {activeRow.assignedCount}/{activeRow.enabledCount} plazas usadas
                        </p>
                      </div>
                      <div className="border rounded-lg bg-emerald-50/60 border-emerald-100 p-3">
                        <p className="font-semibold text-emerald-800 text-sm">Disponibles</p>
                        <p>{activeRow.availableCount} asientos libres</p>
                      </div>
                      <div className="border rounded-lg bg-amber-50/60 border-amber-100 p-3">
                        <p className="font-semibold text-amber-800 text-sm">Bloqueados</p>
                        <p>{activeRow.disabledCount} reservados/bloqueados</p>
                      </div>
                    </div>
                    {activeRow?.reservedLabel && (
                      <div className="border border-amber-200 bg-amber-50 rounded px-3 py-2 text-xs text-amber-700">
                        Fila reservada para {activeRow.reservedLabel}.
                      </div>
                    )}
                  </>
                ) : null}
              </>
            )}
          </section>

          {activeRow ? (
            <section className="space-y-3">
              <header className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Asientos de la fila</h4>
                <span className="text-xs text-gray-500">{activeRowSeats.length} asientos</span>
              </header>
              {seatSummaries.length === 0 ? (
                <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded p-3">
                  No hay asientos generados para esta fila.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {seatSummaries.map((seat) => (
                    <div
                      key={seat.id}
                      className={`border rounded px-3 py-2 text-xs ${
                        seat.disabled
                          ? 'bg-gray-100 border-gray-200 text-gray-500'
                          : seat.assigned
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : seat.reservedLabel
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="block truncate">
                            {seat.label}
                            {seat.disabled ? ' (reservado)' : seat.assigned ? '' : ' (libre)'}
                          </span>
                          {seat.reservedLabel && (
                            <span className="block text-[10px] uppercase text-amber-700 mt-1">
                              Reservado: {seat.reservedLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">ID {seat.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {ceremonySettings?.notes && ceremonySettings.notes.trim() ? (
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              <span className="block text-gray-700 font-semibold mb-1">Notas de ceremonia</span>
              {ceremonySettings.notes.trim()}
            </div>
          ) : null}

          <section className="space-y-3">
            <header>
              <h4 className="text-sm font-semibold text-gray-900">Sugerencias de invitados</h4>
              <p className="text-xs text-gray-500">
                Basado en tags, grupos y notas de invitados sin asiento asignado.
              </p>
            </header>
            <div className="space-y-3">
              {suggestionBuckets.map((bucket) => {
                const data = Array.isArray(ceremonySuggestions[bucket.key])
                  ? ceremonySuggestions[bucket.key]
                  : [];
                return (
                  <div key={bucket.key} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bucket.title}</p>
                        <p className="text-[11px] text-gray-500">{bucket.description}</p>
                      </div>
                      <span className="text-xs text-gray-400">{data.length}</span>
                    </div>
                    {data.length === 0 ? (
                      <p className="text-xs text-gray-500">Sin candidatos en esta categoría.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.map((guest) => (
                          <li
                            key={guest.id}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs"
                          >
                            <div className="mr-3">
                              <p className="font-medium text-gray-800">{guest.name}</p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {guest.group || guest.tags?.join(', ') || 'Sin grupo definido'}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              onClick={() => onAssignCeremonyGuest?.(guest.id, safeIndex)}
                              disabled={!activeRow || activeRow.availableCount === 0}
                            >
                              {activeRow && activeRow.availableCount > 0 ? 'Asignar a fila' : 'Fila completa'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!selectedTable) {
    return (
      <div
        className={`bg-white border rounded-lg h-full flex items-center justify-center text-gray-500 ${className}`}
      >
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
