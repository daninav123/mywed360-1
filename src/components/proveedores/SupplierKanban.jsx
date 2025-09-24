import React from 'react';

const mapCol = (estado = '') => {
  const e = String(estado || '').toLowerCase();
  if (e.includes('contrat')) return 'contratado';
  if (e.includes('presup')) return 'presupuestos';
  if (e.includes('rechaz') || e.includes('descart')) return 'rechazado';
  if (e.includes('negoci') || e.includes('contact')) return 'proceso';
  return 'vacio';
};

const cols = [
  { key: 'vacio', label: 'Vacía' },
  { key: 'proceso', label: 'En proceso' },
  { key: 'presupuestos', label: 'Presupuestos' },
  { key: 'contratado', label: 'Contratado' },
  { key: 'rechazado', label: 'Rechazado' },
];

const nextOf = (key) => {
  const i = cols.findIndex((c) => c.key === key);
  if (i < 0) return key;
  return cols[Math.min(cols.length - 1, i + 1)].key;
};
const prevOf = (key) => {
  const i = cols.findIndex((c) => c.key === key);
  if (i < 0) return key;
  return cols[Math.max(0, i - 1)].key;
};

export default function SupplierKanban({ proveedores = [], onMove, onClick }) {
  const grouped = cols.reduce((m, c) => ({ ...m, [c.key]: [] }), {});
  for (const p of proveedores) {
    const key = mapCol(p.estado);
    grouped[key] = grouped[key] || [];
    grouped[key].push(p);
  }

  const card = (p) => (
    <div key={p.id} className="rounded border bg-white p-2 shadow-sm hover:shadow cursor-pointer" onClick={() => onClick?.(p)}>
      <div className="font-semibold text-sm truncate">{p.nombre || 'Proveedor'}</div>
      <div className="text-xs text-gray-500 truncate">{p.servicio || 'Servicio'}</div>
      <div className="mt-1 text-xs flex items-center gap-2">
        {p.presupuesto ? <span className="px-1.5 py-0.5 rounded bg-gray-50 border text-gray-700">€ {Number(p.presupuesto).toFixed(0)}</span> : null}
        {p.grupo && <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 truncate">{p.grupo}</span>}
        {p.origen && <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 truncate">{p.origen}</span>}
      </div>
      <div className="mt-2 flex gap-1">
        <button className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onMove?.(p, prevOf(mapCol(p.estado))); }}>←</button>
        <button className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onMove?.(p, nextOf(mapCol(p.estado))); }}>→</button>
        <button className="text-xs px-2 py-0.5 border rounded hover:bg-green-50 text-green-700 ml-auto" onClick={(e) => { e.stopPropagation(); onMove?.(p, 'contratado'); }}>✓</button>
        <button className="text-xs px-2 py-0.5 border rounded hover:bg-red-50 text-red-700" onClick={(e) => { e.stopPropagation(); onMove?.(p, 'rechazado'); }}>✕</button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cols.map((col) => (
        <div key={col.key} className="rounded-lg border bg-white/40">
          <div className="px-3 py-2 text-sm font-semibold border-b bg-gray-50">{col.label}</div>
          <div className="p-2 space-y-2 min-h-[120px]">
            {(grouped[col.key] || []).map(card)}
            {(!grouped[col.key] || grouped[col.key].length === 0) && (
              <div className="text-xs text-gray-400 italic">Sin elementos</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
