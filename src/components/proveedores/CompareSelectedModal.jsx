import React, { useMemo, useState } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import useProveedores from '../../hooks/useProveedores';
import { toast } from 'react-toastify';

function toCSV(rows) {
  const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const headers = [\n    'Nombre',\n    'Servicio',\n    'Estado',\n    'Precio',\n    'Rating',\n    'Ubicación',\n    'Email',\n    'Teléfono',\n    'Puntuación',\n  ];
  const csv = [headers.join(',')]
    .concat(
      rows.map((r) =>
        [
          r.name,
          r.service,
          r.status,
          r.priceRange,
          r.ratingCount > 0 ? (r.rating / r.ratingCount).toFixed(1) : '',
          r.location || r.address || '',
          r.email || '',
          r.phone || '',
        ]
          .map(esc)
          .join(',')
      )
    )
    .join('\n');
  return csv;
}

export default function CompareSelectedModal({ open, onClose, providers = [], onRemoveFromSelection }) {
  const rows = useMemo(() => providers, [providers]);
  const { createGroup } = useSupplierGroups();
  const { updateProvider } = useProveedores();
  const [groupName, setGroupName] = useState('');
  const [minScore, setMinScore] = useState('');
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name' | 'price'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const computeScore = (p) => {
    const a = Number.isFinite(p?.aiMatch) ? Number(p.aiMatch) : NaN;
    const b = Number.isFinite(p?.match) ? Number(p.match) : NaN;
    if (!Number.isNaN(a)) return a;
    if (!Number.isNaN(b)) return b;
    return 0;
  };

  const filteredRows = useMemo(() => {
    const thr = parseFloat(minScore);
    if (!minScore || Number.isNaN(thr)) return rows;
    return rows.filter((r) => computeScore(r) >= thr);
  }, [rows, minScore]);

  const displayRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      if (sortBy === 'name') {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      if (sortBy === 'price') {\n        const ap = computePriceValue(a);\n        const bp = computePriceValue(b);\n        return sortDir === 'asc' ? ap - bp : bp - ap;\n      }\n      // score\n      const as = computeScore(a);\n      const bs = computeScore(b);\n      return sortDir === 'asc' ? as - bs : bs - as;
    });
    return list;
  }, [filteredRows, sortBy, sortDir]);

  const canCreate = groupName.trim().length > 1 && filteredRows.length > 0 && !creating;

  const createGroupFromSelection = async () => {
    if (!canCreate) return;
    try {
      setCreating(true);
      const ids = filteredRows.map((r) => r.id);
      const res = await createGroup({ name: groupName.trim(), memberIds: ids });
      if (res?.success && res?.id) {
        // Actualizar localmente para reflejar el cambio
        await Promise.all(
          filteredRows.map((p) => updateProvider(p.id, { ...p, groupId: res.id, groupName: groupName.trim() }))
        );
        try { toast.success(`Grupo "${groupName.trim()}" creado con ${ids.length} proveedores`); } catch {}
        onClose?.();
      } else {
        try { toast.error(res?.error || 'No se pudo crear el grupo'); } catch {}
      }
    } catch (e) {
      try { toast.error('Error creando grupo'); } catch {}
    } finally {
      setCreating(false);
    }
  };
  const exportCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparativa_proveedores.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Modal open={open} onClose={onClose} title={`Comparar (${rows.length})`}>
      <div className="space-y-4">
        <div className="border rounded p-3 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre de grupo</label>
              <input
                className="w-full border rounded p-2"
                placeholder="Ej. Finalistas FotografÃ­a"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">PuntuaciÃ³n IA mÃ­nima (opcional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                className="w-full border rounded p-2"
                placeholder="Ej. 70"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="md:text-right">
              <div className="text-xs text-gray-500 mb-1">IncluirÃ¡ {filteredRows.length} de {rows.length}</div>
              <Button onClick={createGroupFromSelection} disabled={!canCreate}>
                {creating ? 'Creandoâ€¦' : 'Crear grupo con selecciÃ³n'}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-600">Ordenar por:</span>
            <button
              type="button"
              onClick={() => setSortBy('score')}
              className={`px-2 py-1 border rounded ${sortBy === 'score' ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-700'}`}
            >
              PuntuaciÃ³n IA
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2 py-1 border rounded ${sortBy === 'name' ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-700'}`}
            >
              Nombre
            </button>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 border rounded border-gray-300 text-gray-700"
              title="Cambiar direcciÃ³n"
            >
              {sortDir === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Servicio</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Precio</th>
                <th className="text-left p-2">Rating</th>
                <th className="text-left p-2">Ubicación</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Teléfono</th>
                <th className="text-left p-2">PuntuaciÃ³n</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2">{r.service}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.priceRange || '-'}</td>
                  <td className="p-2">
                    {r.ratingCount > 0 ? (r.rating / r.ratingCount).toFixed(1) : '-'}
                  </td>
                  <td className="p-2">{r.location || r.address || '-'}</td>
                  <td className="p-2">{r.email || '-'}</td>
                  <td className="p-2">{r.phone || '-'}</td>
                  <td className="p-2">{computeScore(r) || '-'}</td>
                  <td className="p-2">
                    {typeof onRemoveFromSelection === 'function' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onRemoveFromSelection(r.id)}
                      >
                        Quitar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}





