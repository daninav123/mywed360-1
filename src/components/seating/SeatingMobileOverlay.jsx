import React, { useMemo, useState } from 'react';

const FabButton = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-12 h-12 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition"
    title={label}
    aria-label={label}
  >
    {icon}
  </button>
);

export default function SeatingMobileOverlay({
  hallSize,
  tables = [],
  selectedTable,
  onSelectTable,
  onOpenGuestDrawer,
  onOpenTemplates,
  onOpenExportWizard,
}) {
  const [fabOpen, setFabOpen] = useState(false);

  const minimap = useMemo(() => {
    const width = hallSize?.width || 1800;
    const height = hallSize?.height || 1200;
    const ratio = height / (width || 1);
    const containerWidth = 260;
    const containerHeight = containerWidth * ratio;
    const scaleX = containerWidth / (width || 1);
    const scaleY = containerHeight / (height || 1);
    const nodes = tables.slice(0, 100).map((table) => {
      const x = (table.x || 0) * scaleX;
      const y = (table.y || 0) * scaleY;
      const selected = selectedTable && selectedTable.id === table.id;
      return (
        <div
          key={table.id}
          className="absolute"
          style={{
            left: Math.max(2, Math.min(containerWidth - 8, x)),
            top: Math.max(2, Math.min(containerHeight - 8, y)),
          }}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              selected ? 'bg-blue-600' : 'bg-gray-500'
            } border border-white shadow`}
          />
        </div>
      );
    });
    return { width: containerWidth, height: containerHeight, nodes };
  }, [hallSize, tables, selectedTable]);

  return (
    <div className="space-y-3">
      <div className="bg-white border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900">Minimapa (placeholder)</p>
          <button
            type="button"
            onClick={onOpenTemplates}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Plantillas
          </button>
        </div>
        <div
          className="relative bg-gray-100 border border-gray-200 rounded"
          style={{ width: minimap.width, height: minimap.height }}
        >
          <div className="absolute inset-0">{minimap.nodes}</div>
          <div className="absolute bottom-1 right-1 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
            {Math.round((hallSize?.width || 0) / 100)} ×{' '}
            {Math.round((hallSize?.height || 0) / 100)} m
          </div>
        </div>
        <p className="mt-2 text-[11px] text-gray-500 leading-snug">
          Los gestos táctiles (pinch to zoom, double tap, swipe) estarán disponibles en el canvas.
          Esta vista es un placeholder para el minimapa interactivo completo.
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Mesas</p>
          <span className="text-xs text-gray-500">{tables.length} totales</span>
        </div>
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
          {tables.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-500 text-center">
              Aún no hay mesas en este plano.
            </div>
          )}
          {tables.map((table) => {
            const assigned = (table.assignedGuests || table.assigned || 0);
            const capacity = table.seats || 0;
            const selected = selectedTable && selectedTable.id === table.id;
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable?.(table.id)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${
                  selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="font-medium">
                  {table.name || `Mesa ${table.id}`}
                </span>
                <span className="text-xs">
                  {assigned}/{capacity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-3 z-40">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                onOpenGuestDrawer?.();
              }}
              className="px-3 py-2 bg-white border rounded shadow text-xs text-gray-700 hover:bg-gray-50"
            >
              Pendientes ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                onOpenExportWizard?.();
              }}
              className="px-3 py-2 bg-white border rounded shadow text-xs text-gray-700 hover:bg-gray-50"
            >
              Exportar
            </button>
          </div>
        )}
        <FabButton
          label="Menú móvil"
          onClick={() => setFabOpen((prev) => !prev)}
          icon={<span className="text-lg">{fabOpen ? '×' : '⋮'}</span>}
        />
      </div>
    </div>
  );
}

