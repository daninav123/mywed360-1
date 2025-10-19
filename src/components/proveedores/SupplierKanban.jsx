import React, { useMemo } from 'react';

function statusToColumn(status = '') {
  const value = String(status || '').toLowerCase();
  if (value.includes('vist')) return 'vistos';
  if (value.includes('contact')) return 'contactado';
  if (value.includes('presup') || value.includes('seleccion')) return 'presupuesto';
  if (value.includes('contrat') || value.includes('confirm')) return 'contratado';
  if (value.includes('rechaz') || value.includes('descart')) return 'rechazado';
  return 'por_definir';
}

const columns = [
  { key: 'por_definir', label: 'Por definir' },
  { key: 'vistos', label: 'Vistos' },
  { key: 'contactado', label: 'Contactados' },
  { key: 'presupuesto', label: 'Presupuesto' },
  { key: 'contratado', label: 'Contratado' },
  { key: 'rechazado', label: 'Rechazado' },
];

export default function SupplierKanban({ proveedores = [], onMove, onClick, showNextAction = false, ...rest }) {
  const grouped = useMemo(() => {
    const map = columns.reduce((acc, col) => {
      acc[col.key] = [];
      return acc;
    }, {});
    (proveedores || []).forEach((prov) => {
      const key = statusToColumn(prov.status || prov.estado);
      if (!map[key]) map[key] = [];
      map[key].push(prov);
    });
    return map;
  }, [proveedores]);

  const handleDrop = (event, targetKey) => {
    event.preventDefault();
    try {
      const raw = event.dataTransfer.getData('application/json');
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.id) return;
      const prov = (proveedores || []).find((p) => p.id === parsed.id);
      if (prov) onMove?.(prov, targetKey);
    } catch (err) {
      console.warn('[SupplierKanban] drop error', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3" {...rest}>
      {columns.map((col) => (
        <div
          key={col.key}
          className="rounded-2xl border border-dashed border-[color:var(--color-text)]/15 bg-white/75 backdrop-blur-sm flex flex-col shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className="px-3 py-2 text-sm font-semibold border-b bg-gray-50 flex items-center justify-between">
            <span>{col.label}</span>
            <span className="text-xs text-gray-500">{(grouped[col.key] || []).length}</span>
          </div>
          <div className="p-2 space-y-2 min-h-[140px]">
            {(grouped[col.key] || []).map((prov) => (
              <article
                key={prov.id}
                draggable
                onDragStart={(e) => {
                  try {
                    e.dataTransfer.setData('application/json', JSON.stringify({ id: prov.id }));
                    e.dataTransfer.effectAllowed = 'move';
                  } catch {}
                }}
                onClick={() => onClick?.(prov)}
                className="rounded-2xl border border-[color:var(--color-text)]/12 bg-white/85 p-3 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {prov.name || prov.nombre || 'Proveedor'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {prov.service || prov.servicio || 'Servicio'}
                    </p>
                  </div>
                  {prov.intelligentScore?.score != null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {prov.intelligentScore.score}
                    </span>
                  )}
                </header>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                  {prov.priceRange && (
                    <span className="px-2 py-0.5 rounded border bg-gray-50">{prov.priceRange}</span>
                  )}
                  {prov.groupName && (
                    <span className="px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
                      Grupo: {prov.groupName}
                    </span>
                  )}
                  {prov.origin && (
                    <span className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                      {prov.origin}
                    </span>
                  )}
                  {showNextAction && prov?.proximaAccion && (
                    <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                      Próxima acción: {prov.proximaAccion}
                    </span>
                  )}
                </div>
                <footer className="mt-3 flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    className="px-2 py-0.5 border rounded hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove?.(prov, 'vacio');
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 border rounded hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove?.(prov, 'presupuestos');
                    }}
                  >
                    Presupuesto
                  </button>
                  <button
                    type="button"
                    className="ml-auto px-2 py-0.5 border rounded text-green-700 border-green-200 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove?.(prov, 'contratado');
                    }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 border rounded text-red-700 border-red-200 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove?.(prov, 'rechazado');
                    }}
                  >
                    ✕
                  </button>
                </footer>
              </article>
            ))}
            {(grouped[col.key] || []).length === 0 && (
              <div className="text-xs text-gray-400 italic text-center py-6 border border-dashed border-gray-200 rounded">
                Arrastra proveedores aquí
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
